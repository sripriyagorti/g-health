import { WeightLog, BPLog, FoodLog, ExerciseLog } from './types';

const now = new Date('2026-03-02T13:39:44-08:00');

// Helper to get date N days ago
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const mockWeightLogs: WeightLog[] = [
  { id: 'w1', weight: 87, timestamp: daysAgo(30) },
  { id: 'w2', weight: 86.5, timestamp: daysAgo(20) },
  { id: 'w3', weight: 86.2, timestamp: daysAgo(10) },
  { id: 'w4', weight: 85.8, timestamp: daysAgo(2) },
  { id: 'w5', weight: 85, timestamp: now.toISOString() },
];

export const mockBPLogs: BPLog[] = [
  { id: 'bp1', systolic: 142, diastolic: 92, timestamp: daysAgo(14) },
  { id: 'bp2', systolic: 140, diastolic: 90, timestamp: daysAgo(10) },
  { id: 'bp3', systolic: 138, diastolic: 88, timestamp: daysAgo(5) },
  { id: 'bp4', systolic: 135, diastolic: 85, timestamp: daysAgo(1) },
];

export const mockFoodLogs: FoodLog[] = [
  { id: 'f1', name: 'Oatmeal', calories: 350, timestamp: daysAgo(6) },
  { id: 'f2', name: 'Chicken Salad', calories: 450, timestamp: daysAgo(5) },
  { id: 'f3', name: 'Dal and Rice', calories: 600, timestamp: daysAgo(4) },
  { id: 'f4', name: 'Apple', calories: 95, timestamp: daysAgo(3) },
  { id: 'f5', name: 'Grilled Fish', calories: 400, timestamp: daysAgo(2) },
  { id: 'f6', name: 'Burger', calories: 800, timestamp: daysAgo(1) },
  { id: 'f7', name: 'Smoothie', calories: 300, timestamp: now.toISOString() },
];

export const mockExerciseLogs: ExerciseLog[] = [
  { id: 'e1', type: 'Walking', durationMinutes: 30, timestamp: daysAgo(6) },
  { id: 'e2', type: 'Yoga', durationMinutes: 45, timestamp: daysAgo(5) },
  { id: 'e3', type: 'Running', durationMinutes: 20, timestamp: daysAgo(3) },
  { id: 'e4', type: 'Cycling', durationMinutes: 40, timestamp: daysAgo(1) },
];
