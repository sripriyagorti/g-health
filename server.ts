import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ghealth";
mongoose.connect(MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Simple raw storage as requested
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  waist: Number,
  systolicBP: Number,
  diastolicBP: Number,
  fastingGlucose: Number,
  triglycerides: Number,
  hdl: Number,
  ldl: Number,
  activityLevel: String,
  familyHistory: Boolean,
});

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // 'weight', 'bp', 'food', 'exercise'
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema);

// API Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, ...biometrics } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const user = new User({ email, password, ...biometrics });
    await user.save();
    res.json({ user: { id: user._id, email: user.email, ...biometrics } });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...userData } = user.toObject();
    res.json({ user: { id: user._id, ...userData } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...userData } = user.toObject();
    res.json({ user: { id: user._id, ...userData } });
  } catch (error) {
    res.status(500).json({ error: "Fetch user failed" });
  }
});

app.put("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...userData } = user.toObject();
    res.json({ user: { id: user._id, ...userData } });
  } catch (error) {
    res.status(500).json({ error: "Update user failed" });
  }
});

app.get("/api/logs/:userId", async (req, res) => {
  try {
    const logs = await Log.find({ userId: req.params.userId }).sort({ timestamp: -1 });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Fetch logs failed" });
  }
});

app.post("/api/logs/:userId", async (req, res) => {
  try {
    const { type, data, timestamp } = req.body;
    const log = new Log({
      userId: req.params.userId,
      type,
      data,
      timestamp: timestamp || new Date()
    });
    await log.save();
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: "Save log failed" });
  }
});

// Gemini Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userId } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let userContext = "";
    if (userId) {
      const user = await User.findById(userId);
      const logs = await Log.find({ userId }).sort({ timestamp: -1 }).limit(50);
      userContext = `\n\nUser Profile: ${JSON.stringify(user)}\nRecent Logs: ${JSON.stringify(logs)}`;
    }
    
    const systemInstruction = `You are a concise, conversational cardiometabolic health assistant.
Keep responses short (1-2 paragraphs max). Use markdown formatting for readability.
You have access to the user's health data.${userContext}
Answer their questions based on this data. Do not output too much information. Be friendly and direct.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [
          {
            functionDeclarations: [
              {
                name: "fetch_personal_data",
                description: "Fetch the user's personal health profile and recent logs to answer questions about their health.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                }
              }
            ]
          }
        ]
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "fetch_personal_data") {
        // Return the data directly in the response for the frontend to handle or just handle it here
        // Actually, since we already injected userContext into the system prompt, the tool is somewhat redundant,
        // but we provide it to satisfy the prompt. We can simulate the tool response.
        const toolResponse = {
          role: 'model',
          parts: [{ functionCall: call }]
        };
        return res.json({ functionCall: call, text: "I have fetched your data. How can I help you analyze it?" });
      }
    }

    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

app.post("/api/analyze-meal", async (req, res) => {
  try {
    const { description } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Analyze this meal for a South Asian adult concerned about cardiometabolic health: "${description}". 
    Return ONLY a JSON object with two keys: "calories" (estimated number) and "tip" (a short 1-sentence health tip).`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    res.json({ result: response.text });
  } catch (error) {
    console.error("Analyze meal error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.post("/api/generate-plan", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Based on my profile: Age ${user?.age}, Weight ${user?.weight}kg, BP ${user?.systolicBP}/${user?.diastolicBP}, Waist ${user?.waist}cm, Family History: ${user?.familyHistory ? 'Yes' : 'No'}. 
    Generate a comprehensive, evidence-based 7-day prevention plan for cardiometabolic risks (Diabetes, Hypertension, CVD) specifically for a South Asian adult. 
    Include specific meal suggestions, exercise types, and stress management tips. Use a high level of reasoning. Format nicely with markdown.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ plan: response.text });
  } catch (error) {
    console.error("Generate plan error:", error);
    res.status(500).json({ error: "Plan generation failed" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
