import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

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
  cuisinePrefs?: string[];
  exercisePrefs?: string[];
}

export interface Log {
  _id?: ObjectId;
  userId: ObjectId | string;
  type: string;
  data: any;
  timestamp: Date;
}

export interface BiomarkerDoc {
  _id?: ObjectId;
  userId: ObjectId;
  markerType: string;
  value: number;
  unit: string;
  testDate: Date;
  notes?: string;
  source?: string;
  createdAt: Date;
}

export interface MedicationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  indication?: string;
  notes?: string;
  active?: boolean;
  createdAt: Date;
}

export interface MedicationAdherenceDoc {
  _id?: ObjectId;
  userId: ObjectId;
  medicationId: ObjectId;
  date: string;
  taken: boolean;
  notes?: string;
  timestamp: Date;
}

export interface BehaviorProfileDoc {
  _id?: ObjectId;
  userId: ObjectId;
  stage: string;
  updatedAt: Date;
  stageHistory: Array<{ stage: string; date: Date }>;
  currentGoals?: string[];
  lastLogDate?: Date;
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db();

    const users = db.collection<User>('users');
    const logs = db.collection<Log>('logs');
    const biomarkers = db.collection<BiomarkerDoc>('biomarkerLogs');
    const meds = db.collection<MedicationDoc>('medications');
    const adherence = db.collection<MedicationAdherenceDoc>('medicationAdherence');
    const behavior = db.collection<BehaviorProfileDoc>('userBehaviorProfiles');

    await users.createIndex({ email: 1 }, { unique: true });
    await logs.createIndex({ userId: 1, timestamp: -1 });
    await logs.createIndex({ userId: 1, type: 1, timestamp: 1 }, { unique: true });
    await biomarkers.createIndex({ userId: 1, testDate: -1 });
    await biomarkers.createIndex({ userId: 1, markerType: 1, testDate: -1 });
    await meds.createIndex({ userId: 1 });
    await adherence.createIndex({ userId: 1, medicationId: 1, date: -1 });
    await adherence.createIndex({ userId: 1, medicationId: 1, date: 1 }, { unique: true });
    await behavior.createIndex({ userId: 1 }, { unique: true });

    console.log("✓ Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    throw error;
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
  if (!db) throw new Error("Database not connected. Call connectDB() first.");
  return db;
}

export const getUsersCollection = () => getDB().collection<User>('users');
export const getLogsCollection = () => getDB().collection<Log>('logs');
export const getBiomarkersCollection = () => getDB().collection<BiomarkerDoc>('biomarkerLogs');
export const getMedicationsCollection = () => getDB().collection<MedicationDoc>('medications');
export const getAdherenceCollection = () => getDB().collection<MedicationAdherenceDoc>('medicationAdherence');
export const getBehaviorCollection = () => getDB().collection<BehaviorProfileDoc>('userBehaviorProfiles');

export function isDBConnected() {
  return db !== null;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return !!password && password.length >= 3;
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
      return true;
    default:
      return false;
  }
}

const BIOMARKER_TYPES = new Set([
  'fasting_glucose', 'total_cholesterol', 'hdl', 'ldl', 'triglycerides',
  'crp', 'homocysteine', 'uric_acid', 'hba1c'
]);

export function validateBiomarker(marker: any): boolean {
  return !!marker
    && typeof marker.markerType === 'string'
    && BIOMARKER_TYPES.has(marker.markerType)
    && typeof marker.value === 'number'
    && typeof marker.unit === 'string';
}
