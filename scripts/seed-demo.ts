import bcrypt from "bcrypt";
import { connectDB, disconnectDB, getUsersCollection, getLogsCollection } from "../src/server/db";

async function seedDemoData() {
  try {
    await connectDB();

    // Create demo user
    const email = "demo@example.com";
    const usersCollection = getUsersCollection();
    const logsCollection = getLogsCollection();

    const existingUser = await usersCollection.findOne({ email });

    let userId: any;
    if (existingUser) {
      console.log("Demo user already exists, clearing old logs...");
      await logsCollection.deleteMany({ userId: existingUser._id });
      userId = existingUser._id;
    } else {
      const hashedPassword = await bcrypt.hash("demo123", 10);
      const result = await usersCollection.insertOne({
        email,
        password: hashedPassword,
        age: 48,
        gender: "male",
        height: 172,
        weight: 88,
        waist: 102,
        systolicBP: 138,
        diastolicBP: 88,
        fastingGlucose: 115,
        triglycerides: 180,
        hdl: 38,
        ldl: 140,
        activityLevel: "light",
        familyHistory: true,
      });
      userId = result.insertedId;
      console.log(`Created demo user: ${email}`);
    }

    // Generate realistic 30-day data
    const today = new Date();
    const logs: any[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();

      // Weight: every 3 days, slightly trending down
      if (i % 3 === 0) {
        logs.push({
          type: "weight",
          data: { weight: 88 - (29 - i) * 0.12 },
          timestamp: new Date(date.setHours(7, 0, 0, 0))
        });
      }

      // Blood Pressure: 2-3 times per week
      if ([1, 3, 5].includes(dayOfWeek)) {
        const systolic = 138 - Math.floor((29 - i) * 0.2) + Math.random() * 8 - 4;
        const diastolic = 88 - Math.floor((29 - i) * 0.15) + Math.random() * 6 - 3;
        logs.push({
          type: "bp",
          data: { systolic: Math.round(systolic), diastolic: Math.round(diastolic) },
          timestamp: new Date(date.setHours(18, 0, 0, 0))
        });
      }

      // Exercise: 4 days per week
      if (![0, 6].includes(dayOfWeek) && Math.random() > 0.25) {
        const types = ["Walking", "Cycling", "Yoga", "Running"];
        const type = types[Math.floor(Math.random() * types.length)];
        const duration = type === "Walking" ? 30 + Math.random() * 20
          : type === "Running" ? 20 + Math.random() * 15
            : type === "Cycling" ? 40 + Math.random() * 20
              : 30 + Math.random() * 15;

        logs.push({
          type: "exercise",
          data: {
            type,
            durationMinutes: Math.round(duration)
          },
          timestamp: new Date(date.setHours(6, 30, 0, 0))
        });
      }

      // Food: daily (breakfast, lunch, dinner-ish)
      const meals = [
        {
          name: "2 rotis with dal and vegetables",
          calories: 380,
          time: 8
        },
        {
          name: "Rice, curry, and salad",
          calories: 520,
          time: 12
        },
        {
          name: "Grilled chicken with broccoli and brown rice",
          calories: 450,
          time: 19
        }
      ];

      for (const meal of meals) {
        logs.push({
          type: "food",
          data: {
            name: meal.name,
            calories: meal.calories + (Math.random() * 100 - 50)
          },
          timestamp: new Date(date.setHours(meal.time, Math.floor(Math.random() * 60), 0, 0))
        });
      }

      // Lipids: every 2 weeks (simulate lab tests)
      if (i % 14 === 0) {
        logs.push({
          type: "lipids",
          data: {
            triglycerides: 180 - (29 - i) * 1.2 + Math.random() * 20 - 10,
            hdl: 38 + (29 - i) * 0.15,
            ldl: 140 - (29 - i) * 0.5,
            glucose: 115 - (29 - i) * 0.3
          },
          timestamp: new Date(date.setHours(8, 0, 0, 0))
        });
      }
    }

    // Bulk upsert logs
    const operations = logs.map(log => ({
      updateOne: {
        filter: {
          userId,
          type: log.type,
          timestamp: log.timestamp
        },
        update: {
          $set: {
            userId,
            type: log.type,
            data: log.data,
            timestamp: log.timestamp
          }
        },
        upsert: true
      }
    }));

    const result = await logsCollection.bulkWrite(operations as any);
    console.log(`\n✅ Demo data seeded!`);
    console.log(`📊 Created ${logs.length} log entries`);
    console.log(`   Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    console.log(`\n🔐 Demo account:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: demo123`);
    console.log(`\n📈 Data includes:`);
    console.log(`   • 30 days of health data`);
    console.log(`   • Weight trending down`);
    console.log(`   • BP improving`);
    console.log(`   • Regular exercise (4x/week)`);
    console.log(`   • Daily meals with realistic calories`);
    console.log(`   • Periodic lipid panel results`);

    await disconnectDB();
    console.log("\n✨ Done!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDemoData();
