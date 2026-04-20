import { WeightLog, BPLog, FoodLog, ExerciseLog } from "../types";

export function calculateDerivedMetrics(logs: {
  weights: WeightLog[];
  bps: BPLog[];
  foods: FoodLog[];
  exercises: ExerciseLog[];
}) {
  const now = Date.now();
  const daysInMs = (days: number) => days * 24 * 60 * 60 * 1000;

  // 1. Weight Slope (past 30 days)
  const weight30DaysAgo = now - daysInMs(30);
  const recentWeights = logs.weights
    .filter((w) => new Date(w.timestamp).getTime() >= weight30DaysAgo)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  let weightSlope = 0;
  if (recentWeights.length >= 2) {
    const w_t30 = recentWeights[0].weight;
    const w_t = recentWeights[recentWeights.length - 1].weight;
    weightSlope = ((w_t - w_t30) / w_t30) * 100;
  }

  // 2. Exercise (past 7 days)
  const exercise7DaysAgo = now - daysInMs(7);
  const recentExercises = logs.exercises.filter(
    (e) => new Date(e.timestamp).getTime() >= exercise7DaysAgo,
  );
  const act7 = recentExercises.reduce((sum, e) => sum + e.durationMinutes, 0);

  // 3. BP Averages (past 14 days)
  const bp14DaysAgo = now - daysInMs(14);
  const recentBPs = logs.bps.filter(
    (bp) => new Date(bp.timestamp).getTime() >= bp14DaysAgo,
  );
  let avgSBP = 0;
  let avgDBP = 0;
  if (recentBPs.length > 0) {
    avgSBP =
      recentBPs.reduce((sum, bp) => sum + bp.systolic, 0) / recentBPs.length;
    avgDBP =
      recentBPs.reduce((sum, bp) => sum + bp.diastolic, 0) / recentBPs.length;
  }

  // 4. Calories Average (past 7 days)
  const food7DaysAgo = now - daysInMs(7);
  const recentFoods = logs.foods.filter(
    (f) => new Date(f.timestamp).getTime() >= food7DaysAgo,
  );
  const totalCalories7Days = recentFoods.reduce(
    (sum, f) => sum + f.calories,
    0,
  );
  const avgCal = totalCalories7Days / 7;

  return { weightSlope, act7, avgSBP, avgDBP, avgCal };
}

export function calculateRiskScores(userData: any, derivedMetrics: any) {
  const {
    age,
    gender,
    height,
    weight,
    waist,
    systolicBP,
    diastolicBP,
    fastingGlucose,
  } = userData;
  const { weightSlope, act7, avgSBP, avgDBP } = derivedMetrics;

  const bmi = weight / (height / 100) ** 2;

  // FPG norm (default to 100 if not provided)
  const fpg = fastingGlucose || 100;
  const norm_G = Math.max(0, Math.min(1, (fpg - 100) / 26));

  // BMI norm (Asian)
  const norm_B = Math.max(0, Math.min(1, (bmi - 23) / 7.5));

  // Waist norm
  const waistThreshold = gender === "male" ? 90 : 80;
  const norm_W = Math.max(0, Math.min(1, (waist - waistThreshold) / 20));

  // Weight Trend norm
  const norm_Wt = Math.min(1, Math.max(0, weightSlope) / 1.5);

  // Activity norm
  const norm_Act = Math.max(0, Math.min(1, 1 - act7 / 150));

  // Diabetes Risk
  const diabetesRisk =
    100 *
    (0.3 * norm_G +
      0.25 * norm_B +
      0.2 * norm_W +
      0.15 * norm_Wt +
      0.1 * norm_Act);

  // BP norm
  const sbp = avgSBP > 0 ? avgSBP : systolicBP;
  const dbp = avgDBP > 0 ? avgDBP : diastolicBP;
  const norm_BP = Math.max(0, Math.min(1, Math.max(sbp - 130, dbp - 80) / 10));

  // Hypertension Risk
  const hypertensionRisk =
    100 * (0.5 * norm_BP + 0.2 * norm_B + 0.15 * norm_Wt + 0.15 * norm_Act);

  // Age Factor
  const ageFactor = Math.max(0, Math.min(1, (age - 40) / 30));

  // CVD Risk
  const cvdRisk = 0.4 * diabetesRisk + 0.4 * hypertensionRisk + 20 * ageFactor;

  return {
    diabetes: diabetesRisk.toFixed(1),
    hypertension: hypertensionRisk.toFixed(1),
    cvd: cvdRisk.toFixed(1),
  };
}
