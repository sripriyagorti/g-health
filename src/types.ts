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
  cuisinePrefs?: string[];
  exercisePrefs?: string[];
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
  portion?: string;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  potassium_mg?: number;
  glycemicIndex?: number;
  source?: 'manual' | 'ai_from_text' | 'ai_from_image' | 'api_lookup';
  usda_fdcId?: string;
  timestamp: string;
}

export interface ExerciseLog {
  id: string;
  type: string;
  durationMinutes: number;
  intensity?: 'light' | 'moderate' | 'vigorous';
  timestamp: string;
}

export type BiomarkerType =
  | 'fasting_glucose'
  | 'total_cholesterol'
  | 'hdl'
  | 'ldl'
  | 'triglycerides'
  | 'crp'
  | 'homocysteine'
  | 'uric_acid'
  | 'hba1c';

export interface BiomarkerLog {
  id: string;
  markerType: BiomarkerType;
  value: number;
  unit: string;
  testDate: string;
  notes?: string;
  source?: 'lab_report' | 'manual_entry' | 'ai_extracted';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  indication?: string;
  notes?: string;
  active?: boolean;
}

export interface MedicationAdherence {
  id: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  taken: boolean;
  notes?: string;
  timestamp: string;
}

export interface UserBehaviorProfile {
  stage: 'precontemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  updatedAt: string;
  currentGoals?: string[];
  lastLogDate?: string;
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

export type PendingFunctionName =
  | 'log_meal'
  | 'log_weight'
  | 'log_bp'
  | 'log_exercise'
  | 'log_biomarker'
  | 'log_medication_adherence'
  | 'add_medication'
  | 'log_medication_taken'
  | 'extract_lab_results';

export interface PendingFunctionCall {
  id: string;
  name: PendingFunctionName;
  args: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text?: string;
  image?: string;
  pendingCalls?: PendingFunctionCall[];
  confirmed?: Record<string, boolean>;
  cancelled?: Record<string, boolean>;
  trends?: Array<{ type: 'weight' | 'bp' | 'calories' | 'biomarker'; data: any; marker_type?: string }>;
}
