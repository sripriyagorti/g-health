import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";
import { ObjectId } from "mongodb";
import { getUsersCollection, getLogsCollection } from "../db";

const ai = new Hono();

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error("Invalid ID");
  }
}

// Chat
ai.post("/chat", async (c) => {
  try {
    const { messages, userId } = await c.req.json();
    const geminiKey = process.env.GEMINI_API_KEY || "";
    const genai = new GoogleGenAI({ apiKey: geminiKey });

    let userContext = "";
    if (userId) {
      const user = await getUsersCollection().findOne({
        _id: toObjectId(userId),
      });
      const logs = await getLogsCollection()
        .find({ userId: toObjectId(userId) })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      userContext = `\n\nUser Profile: ${JSON.stringify(user)}\nRecent Logs: ${JSON.stringify(logs)}`;
    }

    const systemInstruction = `You are a concise, conversational cardiometabolic health assistant for South Asian adults.
Keep responses short (1-2 paragraphs max). Use markdown formatting for readability.
Focus on preventing Type 2 Diabetes, Hypertension, and Cardiovascular Disease.
You have access to the user's health data.${userContext}
Answer their questions based on this data. Be friendly and direct.`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return c.json({ text: response.text });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

// Analyze meal
ai.post("/analyze-meal", async (c) => {
  try {
    const { description } = await c.req.json();
    if (!description) {
      return c.json({ error: "Description required" }, 400);
    }

    const geminiKey = process.env.GEMINI_API_KEY || "";
    const genai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = `Analyze this meal for a South Asian adult concerned about cardiometabolic health: "${description}".
Return ONLY a JSON object with two keys: "calories" (estimated number) and "tip" (a short 1-sentence health tip).`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    return c.json({ result: response.text });
  } catch (error) {
    console.error("Meal analysis error:", error);
    return c.json({ error: "Analysis failed" }, 500);
  }
});

// Generate plan
ai.post("/generate-plan", async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const user = await getUsersCollection().findOne({
      _id: toObjectId(userId),
    });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const geminiKey = process.env.GEMINI_API_KEY || "";
    const genai = new GoogleGenAI({ apiKey: geminiKey });

    const prompt = `Based on my profile: Age ${user.age}, Weight ${user.weight}kg, BP ${user.systolicBP}/${user.diastolicBP}, Waist ${user.waist}cm, Family History: ${user.familyHistory ? "Yes" : "No"}.
Generate a comprehensive, evidence-based 7-day prevention plan for cardiometabolic risks (Diabetes, Hypertension, CVD) specifically for a South Asian adult.
Include specific meal suggestions using South Asian foods, exercise types, and stress management tips. Format nicely with markdown.`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return c.json({ plan: response.text });
  } catch (error) {
    console.error("Plan generation error:", error);
    return c.json({ error: "Plan generation failed" }, 500);
  }
});

export default ai;
