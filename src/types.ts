export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface UserData {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  waist: number; // cm
  systolicBP: number;
  diastolicBP: number;
  fastingGlucose?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  familyHistory: boolean;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text?: string;
  image?: string;
  functionCall?: { name: string; args: any };
  functionResponse?: { name: string; response: any };
  confirmed?: boolean;
}

export interface RiskResults {
  diabetes: RiskLevel;
  hypertension: RiskLevel;
  cardiovascular: RiskLevel;
}

export interface WeightLog {
  id: string;
  weight: number;
  timestamp: string;
}

export interface BPLog {
  id: string;
  systolic: number;
  diastolic: number;
  timestamp: string;
}

export interface FoodLog {
  id: string;
  name: string;
  calories: number;
  timestamp: string;
}

export interface ExerciseLog {
  id: string;
  type: string;
  durationMinutes: number;
  timestamp: string;
}

export interface DailyLog {
  date: string;
  calories: number;
  refinedCarbs: boolean;
  exerciseMinutes: number;
  exerciseType: string;
  weight: number;
  systolicBP: number;
  diastolicBP: number;
}
