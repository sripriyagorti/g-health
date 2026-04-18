/**
 * Seeds demo account: test@test.com / super-secret
 * 60 days of realistic mock data for a South Asian male, 44 yrs
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI!;
const EMAIL = "test@test.com";
const PASSWORD = "super-secret";

function daysAgo(n: number, hourOffset = 8): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, 0, 0, 0);
  return d;
}

function jitter(base: number, pct = 0.04): number {
  return parseFloat((base * (1 + (Math.random() - 0.5) * pct * 2)).toFixed(1));
}

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  // USER
  await db.collection("users").deleteOne({ email: EMAIL });
  const hash = await bcrypt.hash(PASSWORD, 10);
  const { insertedId: userId } = await db.collection("users").insertOne({
    email: EMAIL,
    password: hash,
    name: "Rohan",
    age: 44,
    gender: "male",
    height: 171,
    weight: 83.5,
    waist: 94,
    systolicBP: 134,
    diastolicBP: 86,
    fastingGlucose: 108,
    hdl: 38,
    ldl: 138,
    triglycerides: 182,
    activityLevel: "light",
    familyHistory: true,
    cuisinePrefs: ["South Indian", "North Indian"],
    exercisePrefs: ["Walking", "Yoga"],
    createdAt: daysAgo(62),
  });

  // Clear any old data linked to this new userId (fresh account)
  for (const col of ["logs", "biomarkerLogs", "medications", "medicationAdherence"]) {
    await db.collection(col).deleteMany({ userId });
  }

  // LOGS (60 days)
  const logs: any[] = [];

  // Weight: starts 84.2 kg, slowly trends down
  for (let d = 60; d >= 0; d -= 2) {
    const w = parseFloat((84.2 - (60 - d) * 0.023 + (Math.random() - 0.5) * 0.3).toFixed(1));
    logs.push({ userId, type: "weight", data: { weight: w }, timestamp: daysAgo(d, 7) });
  }

  // BP: moderate, some days elevated
  const bpPairs = [[134,86],[130,84],[132,85],[128,82],[136,88],[131,83],[129,82],[135,87],[127,81],[133,85]];
  for (let d = 59; d >= 0; d -= 3) {
    const pair = bpPairs[Math.floor(d / 6) % bpPairs.length];
    logs.push({ userId, type: "bp", data: { systolic: jitter(pair[0], 0.03), diastolic: jitter(pair[1], 0.03) }, timestamp: daysAgo(d, 7) });
  }

  // Food logs
  const meals = [
    { name: "Masala dosa", calories: 340, protein_g: 8, carbs_g: 52, fat_g: 12, sodium_mg: 480, portion: "1 plate", source: "ai_from_text" },
    { name: "Idli sambar", calories: 260, protein_g: 9, carbs_g: 44, fat_g: 4, sodium_mg: 520, portion: "3 idli", source: "ai_from_text" },
    { name: "Dal tadka + roti", calories: 420, protein_g: 18, carbs_g: 58, fat_g: 10, sodium_mg: 340, portion: "1 cup + 2 roti", source: "ai_from_text" },
    { name: "Chicken curry + rice", calories: 580, protein_g: 34, carbs_g: 65, fat_g: 16, sodium_mg: 620, portion: "1 bowl", source: "ai_from_text" },
    { name: "Upma", calories: 210, protein_g: 6, carbs_g: 38, fat_g: 5, sodium_mg: 380, portion: "1 cup", source: "ai_from_text" },
    { name: "Curd rice", calories: 280, protein_g: 10, carbs_g: 48, fat_g: 6, sodium_mg: 190, portion: "1 cup", source: "ai_from_text" },
    { name: "Rajma chawal", calories: 490, protein_g: 22, carbs_g: 72, fat_g: 8, sodium_mg: 410, portion: "1 bowl", source: "ai_from_text" },
    { name: "Poha", calories: 180, protein_g: 4, carbs_g: 34, fat_g: 4, sodium_mg: 240, portion: "1 cup", source: "ai_from_text" },
    { name: "Grilled chicken salad", calories: 310, protein_g: 38, carbs_g: 12, fat_g: 11, sodium_mg: 280, portion: "1 plate", source: "ai_from_text" },
    { name: "Puri bhaji", calories: 520, protein_g: 11, carbs_g: 74, fat_g: 22, sodium_mg: 560, portion: "3 puri + bhaji", source: "ai_from_text" },
    { name: "Oats with banana", calories: 240, protein_g: 7, carbs_g: 44, fat_g: 4, sodium_mg: 80, portion: "1 bowl", source: "ai_from_text" },
    { name: "Egg bhurji + roti", calories: 380, protein_g: 22, carbs_g: 36, fat_g: 16, sodium_mg: 460, portion: "2 eggs + 2 roti", source: "ai_from_text" },
  ];
  for (let d = 59; d >= 0; d--) {
    const mealCount = d % 5 === 0 ? 2 : 3;
    const mealHours = [8, 13, 20];
    for (let m = 0; m < mealCount; m++) {
      logs.push({ userId, type: "food", data: { ...meals[(d * 3 + m) % meals.length] }, timestamp: daysAgo(d, mealHours[m]) });
    }
  }

  // Exercise
  const exercises = [
    { type: "brisk walking", durationMinutes: 30, intensity: "moderate" },
    { type: "brisk walking", durationMinutes: 45, intensity: "moderate" },
    { type: "yoga", durationMinutes: 40, intensity: "light" },
    { type: "brisk walking", durationMinutes: 20, intensity: "light" },
    { type: "cycling", durationMinutes: 25, intensity: "moderate" },
  ];
  for (let d = 58; d >= 0; d -= 2) {
    logs.push({ userId, type: "exercise", data: { ...exercises[Math.floor(d / 4) % exercises.length] }, timestamp: daysAgo(d, 18) });
  }

  await db.collection("logs").insertMany(logs);

  // BIOMARKERS
  const biomarkers = [
    // Panel 1: 45 days ago
    { markerType: "fasting_glucose", value: 108, unit: "mg/dL", testDate: daysAgo(45), source: "lab_report" },
    { markerType: "total_cholesterol", value: 218, unit: "mg/dL", testDate: daysAgo(45), source: "lab_report" },
    { markerType: "hdl", value: 38, unit: "mg/dL", testDate: daysAgo(45), source: "lab_report" },
    { markerType: "ldl", value: 138, unit: "mg/dL", testDate: daysAgo(45), source: "lab_report" },
    { markerType: "triglycerides", value: 182, unit: "mg/dL", testDate: daysAgo(45), source: "lab_report" },
    { markerType: "crp", value: 3.8, unit: "mg/L", testDate: daysAgo(45), source: "lab_report" },
    { markerType: "hba1c", value: 6.1, unit: "%", testDate: daysAgo(45), source: "lab_report" },
    // Panel 2: 15 days ago (showing improvement)
    { markerType: "fasting_glucose", value: 102, unit: "mg/dL", testDate: daysAgo(15), source: "lab_report" },
    { markerType: "total_cholesterol", value: 209, unit: "mg/dL", testDate: daysAgo(15), source: "lab_report" },
    { markerType: "hdl", value: 41, unit: "mg/dL", testDate: daysAgo(15), source: "lab_report" },
    { markerType: "ldl", value: 130, unit: "mg/dL", testDate: daysAgo(15), source: "lab_report" },
    { markerType: "triglycerides", value: 165, unit: "mg/dL", testDate: daysAgo(15), source: "lab_report" },
    { markerType: "crp", value: 2.9, unit: "mg/L", testDate: daysAgo(15), source: "lab_report" },
  ];
  await db.collection("biomarkerLogs").insertMany(biomarkers.map(b => ({ ...b, userId, createdAt: b.testDate })));

  // MEDICATIONS
  const { insertedId: med1Id } = await db.collection("medications").insertOne({
    userId, name: "Lisinopril", dosage: "5 mg", frequency: "Once daily",
    startDate: daysAgo(58), indication: "Hypertension", active: true, createdAt: daysAgo(58),
  });
  const { insertedId: med2Id } = await db.collection("medications").insertOne({
    userId, name: "Atorvastatin", dosage: "10 mg", frequency: "Once daily",
    startDate: daysAgo(58), indication: "Cholesterol", active: true, createdAt: daysAgo(58),
  });

  // ADHERENCE — mostly taken, realistic misses
  const adherenceDocs: any[] = [];
  const missLisinopril = new Set([14, 27, 41]);
  const missAtorva = new Set([9, 33]);
  for (let d = 57; d >= 0; d--) {
    const date = daysAgo(d).toISOString().slice(0, 10);
    adherenceDocs.push({ userId, medicationId: med1Id, date, taken: !missLisinopril.has(d), timestamp: daysAgo(d, 8) });
    adherenceDocs.push({ userId, medicationId: med2Id, date, taken: !missAtorva.has(d), timestamp: daysAgo(d, 21) });
  }
  await db.collection("medicationAdherence").insertMany(adherenceDocs);

  console.log("✓ Demo account seeded");
  console.log(`  email: ${EMAIL} / password: ${PASSWORD}`);
  console.log(`  userId: ${userId}`);
  console.log(`  logs: ${logs.length} | biomarkers: ${biomarkers.length} | meds: 2 | adherence: ${adherenceDocs.length}`);
  await client.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
