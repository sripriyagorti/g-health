import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { Ollama } from "ollama";
import { getUsersCollection, getLogsCollection, getBiomarkersCollection, getMedicationsCollection } from "../db";
import { generateAgentResponse, ChatContent, ChatPart } from "../../services/ai";
import { searchUSDA } from "./food";

const ai = new Hono();

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";

const isCloud = process.env.OLLAMA_API_KEY;

const ollamaClient = isCloud
  ? new Ollama({
      host: "https://ollama.com",
      headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
    })
  : new Ollama({
      host: OLLAMA_API_URL,
    });

async function ollamaChat(messages: Array<{ role: string; content: string }>) {
  const response = await ollamaClient.chat({
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options: {
      temperature: 0.7,
    },
  });

  return response.message?.content || "";
}

function oid(id: string) {
  try { return new ObjectId(id); }
  catch { throw new Error("Invalid ID"); }
}

const LOGGING_FUNCTIONS = new Set([
  "log_meal", "log_weight", "log_bp", "log_exercise",
  "log_biomarker", "log_medication_adherence",
  "add_medication", "log_medication_taken", "extract_lab_results",
]);

const TREND_FUNCTIONS = new Set([
  "get_weight_trend", "get_bp_trend", "get_calorie_trend", "get_biomarker_trend",
]);

async function buildUserContext(userId?: string) {
  if (!userId) return "";
  try {
    const uid = oid(userId);
    const [user, recentLogs, recentBiomarkers, meds] = await Promise.all([
      getUsersCollection().findOne({ _id: uid }),
      getLogsCollection().find({ userId: uid }).sort({ timestamp: -1 }).limit(5).toArray(),
      getBiomarkersCollection().find({ userId: uid }).sort({ testDate: -1 }).limit(3).toArray(),
      getMedicationsCollection().find({ userId: uid, active: { $ne: false } }).limit(5).toArray(),
    ]);
    const profile = user ? {
      age: user.age, gender: user.gender, height: user.height, weight: user.weight,
      activityLevel: user.activityLevel, familyHistory: user.familyHistory,
    } : {};
    const logsSummary = recentLogs.map(l => ({ type: l.type, timestamp: l.timestamp.toISOString().slice(0, 10) }));
    const biomarkersSummary = recentBiomarkers.map(b => ({ type: b.markerType, value: b.value, unit: b.unit }));
    const medsSummary = meds.map(m => ({ name: m.name, dosage: m.dosage }));
    return `Profile: ${JSON.stringify(profile)}\nRecent logs: ${JSON.stringify(logsSummary)}\nBiomarkers: ${JSON.stringify(biomarkersSummary)}\nMeds: ${JSON.stringify(medsSummary)}`;
  } catch (e) {
    console.error("buildUserContext error:", e);
    return "";
  }
}

ai.post("/ai/chat", async (c) => {
  // Feature flag to disable AI chat entirely
  if (process.env.AI_CHAT_ENABLED !== 'true') {
    return c.json({ 
      text: "AI chat is temporarily unavailable. Please try again later.",
      pendingCalls: [],
    });
  }

  try {
    const { messages, userId } = await c.req.json();
    if (!Array.isArray(messages)) return c.json({ error: "messages required" }, 400);

    let uid;
    try {
      uid = userId ? oid(userId) : undefined;
    } catch {
      uid = undefined;
    }

    const userContext = await buildUserContext(userId);
    let contents: ChatContent[] = messages;

    let text = "";
    let pendingCalls: Array<{ id: string; name: string; args: any }> = [];
    let trends: Array<{ type: string; data: any; marker_type?: string }> = [];

    for (let iter = 0; iter < 3; iter++) {
      let result: { text: string; calls: any[] };
      try {
        result = await generateAgentResponse(contents, userContext);
      } catch (e: any) {
        console.error("generateAgentResponse failed:", e?.message || e);
        result = { text: "Sorry, I'm having trouble connecting to the AI. Please try again in a moment.", calls: [] };
      }
      const { text: t, calls } = result;
      text = t || text;

      if (!calls.length) break;

      const toolCalls = calls.filter(fc => fc.name === "get_food_nutrition_data");
      const trendCalls = calls.filter(fc => TREND_FUNCTIONS.has(fc.name || ""));
      const logCalls = calls.filter(fc => LOGGING_FUNCTIONS.has(fc.name || ""));
      const recoCalls = calls.filter(fc => fc.name === "get_personalized_recommendation");

      if (logCalls.length) {
        pendingCalls = logCalls.map((fc, i) => ({
          id: `${Date.now()}-${i}`,
          name: fc.name || "",
          args: fc.args || {},
        }));
        break;
      }

      if (!toolCalls.length && !recoCalls.length && !trendCalls.length) break;

      const modelParts: ChatPart[] = calls.map(fc => ({ functionCall: fc as any }));
      contents = [...contents, { role: "model", parts: modelParts }];

      const respParts: ChatPart[] = [];
      for (const fc of toolCalls) {
        try {
          const args: any = fc.args || {};
          const results = await searchUSDA(args.food_query, args.portion_size, 3);
          respParts.push({
            functionResponse: { name: "get_food_nutrition_data", response: { results } },
          });
        } catch (e: any) {
          respParts.push({
            functionResponse: { name: "get_food_nutrition_data", response: { error: e.message } },
          });
        }
      }
      for (const fc of trendCalls) {
        try {
          const name = fc.name || "";
          if (name === "get_weight_trend") {
            const logs = await getLogsCollection().find({ userId: uid, type: "weight" }).sort({ timestamp: -1 }).limit(60).toArray();
            const data = logs.reverse();
            trends.push({ type: 'weight', data });
            respParts.push({
              functionResponse: { name, response: { data } },
            });
          } else if (name === "get_bp_trend") {
            const logs = await getLogsCollection().find({ userId: uid, type: "bp" }).sort({ timestamp: -1 }).limit(60).toArray();
            const data = logs.reverse();
            trends.push({ type: 'bp', data });
            respParts.push({
              functionResponse: { name, response: { data } },
            });
          } else if (name === "get_calorie_trend") {
            const logs = await getLogsCollection().find({ userId: uid, type: "food" }).sort({ timestamp: -1 }).limit(30).toArray();
            const byDate = new Map<string, number>();
            logs.forEach(l => {
              const d = l.timestamp.toISOString().slice(0, 10);
              byDate.set(d, (byDate.get(d) || 0) + (l.data.calories || 0));
            });
            const data = Array.from(byDate).map(([date, calories]) => ({ date, calories })).reverse();
            trends.push({ type: 'calories', data });
            respParts.push({
              functionResponse: { name, response: { data } },
            });
          } else if (name === "get_biomarker_trend") {
            const args: any = fc.args || {};
            const bms = await getBiomarkersCollection().find({ userId: uid, markerType: args.marker_type }).sort({ testDate: -1 }).limit(20).toArray();
            const data = bms.reverse();
            trends.push({ type: 'biomarker', data, marker_type: args.marker_type });
            respParts.push({
              functionResponse: { name, response: { data } },
            });
          }
        } catch (e: any) {
          respParts.push({
            functionResponse: { name: fc.name || "", response: { error: e.message } },
          });
        }
      }
      for (const fc of recoCalls) {
        respParts.push({
          functionResponse: { name: "get_personalized_recommendation", response: { ok: true, note: "Provide direct advice in your reply." } },
        });
      }
      if (respParts.length > 0) {
        contents = [...contents, { role: "user", parts: respParts }];
      }
    }

    return c.json({ text, pendingCalls, ...(trends.length > 0 && { trends }) });
  } catch (error: any) {
    console.error("AI chat error:", error?.message || error);
    const msg = error?.message || "Chat failed";
    const isOllamaError = msg.includes("Internal Server Error") || msg.includes("model") || msg.includes("not found");
    return c.json({ 
      error: isOllamaError ? "AI chat temporarily unavailable. Please try again." : msg 
    }, isOllamaError ? 503 : 500);
  }
});

ai.post("/chat", async (c) => {
  try {
    const { messages, userId } = await c.req.json();
    const userContext = await buildUserContext(userId);
    const systemInstruction = `You are a concise, conversational cardiometabolic health assistant for South Asian adults.
Keep responses short (1-2 paragraphs max). Use markdown for readability.${userContext ? "\n\n" + userContext : ""}`;

    const text = await ollamaChat([
      { role: "system", content: systemInstruction },
      ...messages,
    ]);

    return c.json({ text });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

ai.post("/analyze-meal", async (c) => {
  try {
    const { description } = await c.req.json();
    if (!description) return c.json({ error: "Description required" }, 400);

    const prompt = `Analyze this meal for a South Asian adult: "${description}".
Return ONLY JSON with keys "calories" (number) and "tip" (1-sentence string).`;

    const text = await ollamaChat([
      { role: "system", content: "You are a nutrition analyst. Return only valid JSON." },
      { role: "user", content: prompt },
    ]);

    return c.json({ result: text });
  } catch (error) {
    console.error("Meal analysis error:", error);
    return c.json({ error: "Analysis failed" }, 500);
  }
});

ai.post("/generate-plan", async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: "User ID required" }, 400);

    const user = await getUsersCollection().findOne({ _id: oid(userId) });
    if (!user) return c.json({ error: "User not found" }, 404);

    const prompt = `Profile: Age ${user.age}, Weight ${user.weight}kg, BP ${user.systolicBP}/${user.diastolicBP}, Waist ${user.waist}cm, Family History: ${user.familyHistory ? "Yes" : "No"}.
Generate a 7-day cardiometabolic prevention plan for a South Asian adult. Include meal ideas with South Asian foods, exercise types, stress management. Markdown formatting.`;

    const text = await ollamaChat([
      { role: "system", content: "You are a cardiometabolic health coach. Provide practical, personalized plans." },
      { role: "user", content: prompt },
    ]);

    return c.json({ plan: text });
  } catch (error) {
    console.error("Plan generation error:", error);
    return c.json({ error: "Plan generation failed" }, 500);
  }
});

ai.post("/ai/profile-summary", async (c) => {
  try {
    const { profile } = await c.req.json();

    const prompt = `You are a concise cardiometabolic health coach. Given this South Asian adult's profile, write a brief personalised health summary in exactly 3 bullet points. Each bullet: one short sentence insight + one short action. Be warm, specific, evidence-based.

Profile: ${JSON.stringify(profile)}

Format as JSON: { "bullets": [{ "insight": "...", "action": "..." }, ...] }
Keep each insight under 15 words and action under 15 words.`;

    const text = await ollamaChat([
      { role: "system", content: "You are a concise cardiometabolic health coach. Return only valid JSON." },
      { role: "user", content: prompt },
    ]);

    const parsed = JSON.parse(text);
    return c.json({ bullets: parsed.bullets || [] });
  } catch (error: any) {
    console.error("Profile summary error:", error);
    return c.json({ bullets: [] }, 500);
  }
});

export default ai;