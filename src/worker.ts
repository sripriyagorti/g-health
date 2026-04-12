import { Hono } from "hono";
import { connectDB } from "./server/db";
import auth from "./server/routes/auth";
import logs from "./server/routes/logs";
import ai from "./server/routes/ai";

type Env = {
  MONGODB_URI: string;
  GEMINI_API_KEY: string;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
};

const app = new Hono<{ Bindings: Env }>();

// Inject env vars and connect DB once per worker instance
let dbConnected = false;
app.use("*", async (c, next) => {
  process.env.MONGODB_URI = c.env.MONGODB_URI;
  process.env.GEMINI_API_KEY = c.env.GEMINI_API_KEY;
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  await next();
});

// API routes
app.route("/api/auth", auth);
app.route("/api/logs", logs);
app.route("/api", ai);

// Serve React SPA for everything else
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
