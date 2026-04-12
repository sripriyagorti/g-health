import { Hono } from "hono";
import { connectDB } from "./server/db";
import auth from "./server/routes/auth";
import logs from "./server/routes/logs";
import ai from "./server/routes/ai";

type Env = {
  MONGODB_URI: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

// Connect DB once
let dbConnected = false;
app.use("*", async (c, next) => {
  if (!dbConnected) {
    process.env.MONGODB_URI = c.env.MONGODB_URI;
    process.env.GEMINI_API_KEY = c.env.GEMINI_API_KEY;
    await connectDB();
    dbConnected = true;
  }
  await next();
});

// API routes
app.route("/api/auth", auth);
app.route("/api/logs", logs);
app.route("/api", ai);

// 404 fallback
app.get("*", (c) =>
  c.json({ error: "Not found" }, 404)
);

export default app;
