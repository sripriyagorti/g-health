import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { connectDB, getUsersCollection, getLogsCollection, getBiomarkersCollection, getMedicationsCollection, getAdherenceCollection } from "./src/server/db";
import auth from "./src/server/routes/auth";
import logs from "./src/server/routes/logs";
import ai from "./src/server/routes/ai";
import biomarkers from "./src/server/routes/biomarkers";
import medications from "./src/server/routes/medications";
import food from "./src/server/routes/food";
import bcrypt from "bcryptjs";

const app = new Hono();

// Request timeout middleware (30s max for Railway)
app.use('*', async (c, next) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    await next();
  } finally {
    clearTimeout(timeoutId);
  }
});

// Demo-only: re-seed test@test.com data without touching user record
app.post("/api/demo/reset", async (c) => {
  try {
    const DEMO_EMAIL = "test@test.com";
    const user = await getUsersCollection().findOne({ email: DEMO_EMAIL });
    if (!user) return c.json({ error: "Demo account not found" }, 404);
    const userId = user._id;

    // Wipe all logs/data for this user
    await Promise.all([
      getLogsCollection().deleteMany({ userId }),
      getBiomarkersCollection().deleteMany({ userId }),
      getMedicationsCollection().deleteMany({ userId }),
      getAdherenceCollection().deleteMany({ userId }),
    ]);

    function daysAgo(n: number, h = 8) {
      const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d;
    }
    function jitter(base: number, pct = 0.04) {
      return parseFloat((base * (1 + (Math.random() - 0.5) * pct * 2)).toFixed(1));
    }

    const logs: any[] = [];
    for (let d = 60; d >= 0; d -= 2) {
      const w = parseFloat((84.2 - (60 - d) * 0.023 + (Math.random() - 0.5) * 0.3).toFixed(1));
      logs.push({ userId, type: "weight", data: { weight: w }, timestamp: daysAgo(d, 7) });
    }
    const bpPairs = [[134,86],[130,84],[132,85],[128,82],[136,88],[131,83],[129,82],[135,87],[127,81],[133,85]];
    for (let d = 59; d >= 0; d -= 3) {
      const pair = bpPairs[Math.floor(d / 6) % bpPairs.length];
      logs.push({ userId, type: "bp", data: { systolic: jitter(pair[0],0.03), diastolic: jitter(pair[1],0.03) }, timestamp: daysAgo(d, 7) });
    }
    const meals = [
      { name:"Masala dosa",calories:340,protein_g:8,carbs_g:52,fat_g:12,sodium_mg:480,portion:"1 plate",source:"ai_from_text"},
      { name:"Idli sambar",calories:260,protein_g:9,carbs_g:44,fat_g:4,sodium_mg:520,portion:"3 idli",source:"ai_from_text"},
      { name:"Dal tadka + roti",calories:420,protein_g:18,carbs_g:58,fat_g:10,sodium_mg:340,portion:"1 cup + 2 roti",source:"ai_from_text"},
      { name:"Chicken curry + rice",calories:580,protein_g:34,carbs_g:65,fat_g:16,sodium_mg:620,portion:"1 bowl",source:"ai_from_text"},
      { name:"Upma",calories:210,protein_g:6,carbs_g:38,fat_g:5,sodium_mg:380,portion:"1 cup",source:"ai_from_text"},
      { name:"Curd rice",calories:280,protein_g:10,carbs_g:48,fat_g:6,sodium_mg:190,portion:"1 cup",source:"ai_from_text"},
      { name:"Rajma chawal",calories:490,protein_g:22,carbs_g:72,fat_g:8,sodium_mg:410,portion:"1 bowl",source:"ai_from_text"},
      { name:"Oats with banana",calories:240,protein_g:7,carbs_g:44,fat_g:4,sodium_mg:80,portion:"1 bowl",source:"ai_from_text"},
    ];
    for (let d = 59; d >= 0; d--) {
      const cnt = d % 5 === 0 ? 2 : 3;
      [8,13,20].slice(0, cnt).forEach((h, m) => {
        logs.push({ userId, type:"food", data:{...meals[(d*3+m)%meals.length]}, timestamp: daysAgo(d,h) });
      });
    }
    const exs = [
      { type:"brisk walking",durationMinutes:30,intensity:"moderate"},
      { type:"yoga",durationMinutes:40,intensity:"light"},
      { type:"brisk walking",durationMinutes:45,intensity:"moderate"},
    ];
    for (let d = 58; d >= 0; d -= 2)
      logs.push({ userId, type:"exercise", data:{...exs[Math.floor(d/4)%exs.length]}, timestamp: daysAgo(d,18) });

    await getLogsCollection().insertMany(logs);

    const biomarkerDocs = [
      { markerType:"fasting_glucose",value:108,unit:"mg/dL",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"total_cholesterol",value:218,unit:"mg/dL",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"hdl",value:38,unit:"mg/dL",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"ldl",value:138,unit:"mg/dL",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"triglycerides",value:182,unit:"mg/dL",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"crp",value:3.8,unit:"mg/L",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"hba1c",value:6.1,unit:"%",testDate:daysAgo(45),source:"lab_report"},
      { markerType:"fasting_glucose",value:102,unit:"mg/dL",testDate:daysAgo(15),source:"lab_report"},
      { markerType:"total_cholesterol",value:209,unit:"mg/dL",testDate:daysAgo(15),source:"lab_report"},
      { markerType:"ldl",value:130,unit:"mg/dL",testDate:daysAgo(15),source:"lab_report"},
      { markerType:"triglycerides",value:165,unit:"mg/dL",testDate:daysAgo(15),source:"lab_report"},
    ];
    await getBiomarkersCollection().insertMany(biomarkerDocs.map(b => ({ ...b, userId, createdAt: b.testDate })));

    const { insertedId: med1Id } = await getMedicationsCollection().insertOne({ userId, name:"Lisinopril",dosage:"5 mg",frequency:"Once daily",startDate:daysAgo(58),indication:"Hypertension",active:true,createdAt:daysAgo(58) });
    const { insertedId: med2Id } = await getMedicationsCollection().insertOne({ userId, name:"Atorvastatin",dosage:"10 mg",frequency:"Once daily",startDate:daysAgo(58),indication:"Cholesterol",active:true,createdAt:daysAgo(58) });

    const adherence: any[] = [];
    const miss1 = new Set([14,27,41]); const miss2 = new Set([9,33]);
    for (let d = 57; d >= 0; d--) {
      const date = daysAgo(d).toISOString().slice(0,10);
      adherence.push({ userId, medicationId:med1Id, date, taken:!miss1.has(d), timestamp:daysAgo(d,8) });
      adherence.push({ userId, medicationId:med2Id, date, taken:!miss2.has(d), timestamp:daysAgo(d,21) });
    }
    await getAdherenceCollection().insertMany(adherence);

    return c.json({ ok: true, logs: logs.length });
  } catch (e: any) {
    console.error("Demo reset error:", e);
    return c.json({ error: e.message }, 500);
  }
});

app.route("/api/auth", auth);
app.route("/api/logs", logs);
app.route("/api/biomarkers", biomarkers);
app.route("/api/medications", medications);
app.route("/api/food", food);
app.route("/api", ai);

app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "index.html", root: "./dist" }));

await connectDB();

const port = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${port}`);

// Graceful shutdown on signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Log memory usage periodically (Railway debugging)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const mem = process.memoryUsage();
    console.log(`[Memory] heapUsed: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / heapTotal: ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
  }, 30000);
}

export default { port, fetch: app.fetch };
