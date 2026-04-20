import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getUsersCollection, getLogsCollection, getBiomarkersCollection, getMedicationsCollection } from "../db";
import { generateAgentResponse, ChatContent, ChatPart, openai, TEXT_MODEL, VISION_MODEL } from "../../services/ai";
import { searchUSDA } from "./food";

const ai = new Hono();

function oid(id: string) {
  try { return new ObjectId(id); }
  catch { throw new Error("Invalid ID"); }
}

async function openaiChat(messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: messages as any,
  });
  return response.choices[0]?.message?.content || "";
}

function estimateNutrition(foodQuery: string) {
  const estimates: Record<string, any> = {
    sushi: { name: "Sushi (estimate)", calories: 250, protein_g: 9, carbs_g: 35, fat_g: 7, fiber_g: 1, sodium_mg: 400, portion: "6 pieces" },
    "dal rice": { name: "Dal rice (estimate)", calories: 350, protein_g: 12, carbs_g: 55, fat_g: 6, fiber_g: 4, sodium_mg: 300, portion: "1 cup" },
    "chicken curry": { name: "Chicken curry (estimate)", calories: 300, protein_g: 28, carbs_g: 15, fat_g: 12, fiber_g: 2, sodium_mg: 500, portion: "1 cup" },
    pizza: { name: "Pizza (estimate)", calories: 280, protein_g: 12, carbs_g: 35, fat_g: 10, fiber_g: 2, sodium_mg: 600, portion: "1 slice" },
    burger: { name: "Burger (estimate)", calories: 500, protein_g: 28, carbs_g: 45, fat_g: 20, fiber_g: 2, sodium_mg: 800, portion: "1 burger" },
  };

  const normalized = foodQuery.toLowerCase().trim();
  for (const [key, est] of Object.entries(estimates)) {
    if (normalized.includes(key)) return est;
  }

  return {
    name: `${foodQuery} (rough estimate)`,
    calories: 300, protein_g: 12, carbs_g: 40, fat_g: 10, fiber_g: 2, sodium_mg: 400, portion: "1 serving",
  };
}

const LOGGING_FUNCTIONS = new Set([
  "log_meal", "log_weight", "log_bp", "log_exercise",
  "log_biomarker", "log_medication_adherence",
  "add_medication", "log_medication_taken", "extract_lab_results",
]);

const TREND_FUNCTIONS = new Set([
  "get_weight_trend", "get_bp_trend", "get_calorie_trend", "get_biomarker_trend",
]);

async function buildUserContext(userId?: string): Promise<string> {
  if (!userId) return "";
  try {
    const uid = oid(userId);
    const [user, recentLogs, recentBiomarkers, meds] = await Promise.all([
      getUsersCollection().findOne({ _id: uid }),
      getLogsCollection().find({ userId: uid }).sort({ timestamp: -1 }).limit(5).toArray(),
      getBiomarkersCollection().find({ userId: uid }).sort({ testDate: -1 }).limit(3).toArray(),
      getMedicationsCollection().find({ userId: uid, active: { $ne: false } }).limit(5).toArray(),
    ]);
    const profile = user
      ? { age: user.age, gender: user.gender, height: user.height, weight: user.weight, activityLevel: user.activityLevel, familyHistory: user.familyHistory }
      : {};
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
  console.log("[AI Chat] POST /ai/chat");

  if (process.env.AI_CHAT_ENABLED !== "true") {
    return c.json({ text: "AI chat is temporarily unavailable.", pendingCalls: [] });
  }

  try {
    const { messages, userId } = await c.req.json();
    if (!Array.isArray(messages)) return c.json({ error: "messages required" }, 400);

    let uid: ObjectId | undefined;
    try { uid = userId ? oid(userId) : undefined; } catch { uid = undefined; }

    const userContext = await buildUserContext(userId);

    let contents: ChatContent[] = messages;
    let text = "";
    let pendingCalls: Array<{ id: string; name: string; args: any }> = [];
    let trends: Array<{ type: string; data: any; marker_type?: string }> = [];

    for (let iter = 0; iter < 3; iter++) {
      console.log(`[AI Chat] Iteration ${iter + 1}/3`);

      // Strip images after first iteration — save tokens, vision not needed
      let contentsForAI = contents;
      if (iter > 0) {
        contentsForAI = contents.map((c) => ({
          ...c,
          parts: c.parts.filter((p: any) => !p.inlineData),
        }));
      }

      let result: { text: string; calls: any[] };
      try {
        result = await generateAgentResponse(contentsForAI, userContext);
      } catch (e: any) {
        console.error("[AI Chat] generateAgentResponse failed:", e?.message || e);
        result = { text: "Sorry, AI unavailable. Try again.", calls: [] };
      }

      const { text: t, calls } = result;
      if (t) text = t;

      if (!calls.length) break;

      const toolCalls = calls.filter(fc => fc.name === "get_food_nutrition_data");
      const trendCalls = calls.filter(fc => TREND_FUNCTIONS.has(fc.name || ""));
      const logCalls = calls.filter(fc => LOGGING_FUNCTIONS.has(fc.name || ""));
      const recoCalls = calls.filter(fc => fc.name === "get_personalized_recommendation");

      // Logging calls → send to UI for confirmation, stop loop
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

      // Food nutrition lookups
      for (const fc of toolCalls) {
        const args: any = fc.args || {};
        try {
          const results = await searchUSDA(args.food_query, args.portion_size, 3);
          respParts.push({
            functionResponse: { id: fc.id, name: "get_food_nutrition_data", response: { results } },
          });
        } catch {
          respParts.push({
            functionResponse: {
              id: fc.id,
              name: "get_food_nutrition_data",
              response: { results: [estimateNutrition(args.food_query)] },
            },
          });
        }
      }

      // Trend data fetches
      for (const fc of trendCalls) {
        const name = fc.name || "";
        try {
          if (name === "get_weight_trend") {
            const logs = await getLogsCollection().find({ userId: uid, type: "weight" }).sort({ timestamp: -1 }).limit(60).toArray();
            const data = logs.reverse();
            trends.push({ type: "weight", data });
            respParts.push({ functionResponse: { id: fc.id, name, response: { data } } });
          } else if (name === "get_bp_trend") {
            const logs = await getLogsCollection().find({ userId: uid, type: "bp" }).sort({ timestamp: -1 }).limit(60).toArray();
            const data = logs.reverse();
            trends.push({ type: "bp", data });
            respParts.push({ functionResponse: { id: fc.id, name, response: { data } } });
          } else if (name === "get_calorie_trend") {
            const logs = await getLogsCollection().find({ userId: uid, type: "food" }).sort({ timestamp: -1 }).limit(30).toArray();
            const byDate = new Map<string, number>();
            logs.forEach(l => {
              const d = l.timestamp.toISOString().slice(0, 10);
              byDate.set(d, (byDate.get(d) || 0) + (l.data.calories || 0));
            });
            const data = Array.from(byDate).map(([date, calories]) => ({ date, calories })).reverse();
            trends.push({ type: "calories", data });
            respParts.push({ functionResponse: { id: fc.id, name, response: { data } } });
          } else if (name === "get_biomarker_trend") {
            const args: any = fc.args || {};
            const bms = await getBiomarkersCollection()
              .find({ userId: uid, markerType: args.marker_type })
              .sort({ testDate: -1 })
              .limit(20)
              .toArray();
            const data = bms.reverse();
            trends.push({ type: "biomarker", data, marker_type: args.marker_type });
            respParts.push({ functionResponse: { id: fc.id, name, response: { data } } });
          }
        } catch (e: any) {
          respParts.push({ functionResponse: { id: fc.id, name, response: { error: e.message } } });
        }
      }

      // Recommendation calls — no data fetch, let model respond
      for (const fc of recoCalls) {
        respParts.push({
          functionResponse: {
            id: fc.id,
            name: "get_personalized_recommendation",
            response: { ok: true, note: "Provide direct advice in your reply." },
          },
        });
      }

      if (respParts.length > 0) {
        contents = [...contents, { role: "user", parts: respParts }];
      }
    }

    return c.json({ text, pendingCalls, ...(trends.length > 0 && { trends }) });
  } catch (error: any) {
    console.error("[AI Chat] Fatal:", error?.message || error);
    return c.json({ error: "Chat failed. Please try again." }, 500);
  }
});

ai.post("/chat", async (c) => {
  try {
    const { messages, userId } = await c.req.json();
    const userContext = await buildUserContext(userId);
    const systemInstruction = `You are a concise cardiometabolic health assistant for South Asian adults. Keep responses short (1-2 paragraphs). Use markdown.${userContext ? "\n\n" + userContext : ""}`;

    const text = await openaiChat([
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

    const text = await openaiChat([
      { role: "system", content: "You are a nutrition analyst. Return only valid JSON." },
      {
        role: "user",
        content: `Analyze this meal for a South Asian adult: "${description}". Return ONLY JSON with keys "calories" (number) and "tip" (1-sentence string).`,
      },
    ]);

    return c.json({ result: text });
  } catch (error) {
    console.error("Meal analysis error:", error);
    return c.json({ error: "Analysis failed" }, 500);
  }
});

ai.post("/generate-plan", async (c) => {
  console.log("[Generate Plan] POST /generate-plan");
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: "User ID required" }, 400);

    const user = await getUsersCollection().findOne({ _id: oid(userId) });
    if (!user) return c.json({ error: "User not found" }, 404);

    const prompt = `Profile: Age ${user.age}, Weight ${user.weight}kg, BP ${user.systolicBP}/${user.diastolicBP}, Waist ${user.waist}cm, Family History: ${user.familyHistory ? "Yes" : "No"}.
Generate a 7-day cardiometabolic prevention plan for a South Asian adult. Include meal ideas with South Asian foods, exercise types, stress management. Markdown formatting.`;

    const text = await openaiChat([
      { role: "system", content: "You are a cardiometabolic health coach. Provide practical, personalized plans." },
      { role: "user", content: prompt },
    ]);

    return c.json({ plan: text });
  } catch (error: any) {
    console.error("[Generate Plan] Error:", error?.message || error);
    return c.json({ error: "Plan generation failed" }, 500);
  }
});

ai.post("/ai/profile-summary", async (c) => {
  console.log("[Profile Summary] POST /ai/profile-summary");
  try {
    const { profile } = await c.req.json();

    const prompt = `You are a concise cardiometabolic health coach. Given this South Asian adult's profile, write a personalised health summary in exactly 3 bullet points. Each bullet: one short insight + one short action. Be warm, specific, evidence-based.

Profile: ${JSON.stringify(profile)}

Format as JSON: { "bullets": [{ "insight": "...", "action": "..." }, ...] }
Keep each insight under 15 words and action under 15 words.`;

    const text = await openaiChat([
      { role: "system", content: "You are a concise cardiometabolic health coach. Return only valid JSON." },
      { role: "user", content: prompt },
    ]);

    const jsonStr = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonStr);
    return c.json({ bullets: parsed.bullets || [] });
  } catch (error: any) {
    console.error("[Profile Summary] Error:", error?.message || error);
    return c.json({ bullets: [] }, 500);
  }
});

ai.post("/ai/describe-image", async (c) => {
  try {
    const { image } = await c.req.json();
    if (!image) return c.json({ error: "image required" }, 400);

    // Extract base64 from data URI if needed
    let base64 = image as string;
    let mimeType = "image/jpeg";
    if (base64.startsWith("data:")) {
      const m = base64.match(/data:([^;]+);base64,(.+)/);
      if (m) { mimeType = m[1]; base64 = m[2]; }
    }

    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a medical assistant. Briefly describe what you see in 1-2 sentences. Focus on food, medical documents, or health-related items.",
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: "Describe this image." },
          ],
        },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const description = response.choices[0]?.message?.content || "";
    return c.json({ description });
  } catch (error: any) {
    console.error("Image description error:", error);
    return c.json({ description: "" }, 500);
  }
});

export default ai;
