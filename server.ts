import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { connectDB } from "./src/server/db";
import auth from "./src/server/routes/auth";
import logs from "./src/server/routes/logs";
import ai from "./src/server/routes/ai";

const app = new Hono();

// API routes
app.route("/api/auth", auth);
app.route("/api/logs", logs);
app.route("/api", ai);

// Serve React app (production)
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "index.html", root: "./dist" }));

await connectDB();

const port = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${port}`);

export default { port, fetch: app.fetch };
