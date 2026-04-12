import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/g-health";

// Types
export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  waist?: number;
  systolicBP?: number;
  diastolicBP?: number;
  fastingGlucose?: number;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  activityLevel?: string;
  familyHistory?: boolean;
}

export interface Log {
  _id?: ObjectId;
  userId: ObjectId | string;
  type: string;
  data: any;
  timestamp: Date;
}

// Client & DB
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB() {
  if (db) {
    console.log("✓ Already connected to MongoDB");
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();

    // Create indexes
    const usersCollection = db.collection<User>('users');
    const logsCollection = db.collection<Log>('logs');

    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await logsCollection.createIndex({ userId: 1, timestamp: -1 });
    await logsCollection.createIndex({ userId: 1, type: 1, timestamp: 1 }, { unique: true });

    console.log("✓ Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log("✓ Disconnected from MongoDB");
    }
  } catch (error) {
    console.error("✗ MongoDB disconnect error:", error);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

export function getUsersCollection(): Collection<User> {
  return getDB().collection<User>('users');
}

export function getLogsCollection(): Collection<Log> {
  return getDB().collection<Log>('logs');
}

export function isDBConnected() {
  return db !== null;
}

// Validation helpers
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password && password.length >= 3;
}

export function validateLogData(type: string, data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  switch (type) {
    case 'weight':
      return typeof data.weight === 'number';
    case 'bp':
      return typeof data.systolic === 'number' && typeof data.diastolic === 'number';
    case 'food':
      return typeof data.name === 'string' && typeof data.calories === 'number';
    case 'exercise':
      return typeof data.type === 'string' && typeof data.durationMinutes === 'number';
    case 'lipids':
      return true; // All fields optional
    default:
      return false;
  }
}
