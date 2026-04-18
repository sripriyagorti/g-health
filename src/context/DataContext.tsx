import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';
import type { WeightLog, BPLog, FoodLog, ExerciseLog, BiomarkerLog, Medication, MedicationAdherence } from '../types';

interface DataCtx {
  weightLogs: WeightLog[];
  bpLogs: BPLog[];
  foodLogs: FoodLog[];
  exerciseLogs: ExerciseLog[];
  biomarkers: BiomarkerLog[];
  medications: Medication[];
  adherence: MedicationAdherence[];
  refresh: () => Promise<void>;
  refreshBiomarkers: () => Promise<void>;
  refreshMeds: () => Promise<void>;
}

const Ctx = createContext<DataCtx | null>(null);

function mapLogs(logs: any[]) {
  const weights: WeightLog[] = [];
  const bps: BPLog[] = [];
  const foods: FoodLog[] = [];
  const exercises: ExerciseLog[] = [];
  for (const l of logs) {
    const ts = typeof l.timestamp === 'string' ? l.timestamp : new Date(l.timestamp).toISOString();
    const id = String(l._id || l.id || Date.now() + Math.random());
    if (l.type === 'weight') weights.push({ id, weight: l.data.weight, timestamp: ts });
    else if (l.type === 'bp') bps.push({ id, systolic: l.data.systolic, diastolic: l.data.diastolic, timestamp: ts });
    else if (l.type === 'food') foods.push({ id, name: l.data.name, calories: l.data.calories, ...l.data, timestamp: ts });
    else if (l.type === 'exercise') exercises.push({ id, type: l.data.type, durationMinutes: l.data.durationMinutes, intensity: l.data.intensity, timestamp: ts });
  }
  return { weights, bps, foods, exercises };
}

function mapBiomarker(d: any): BiomarkerLog {
  return {
    id: String(d._id || d.id),
    markerType: d.markerType,
    value: d.value,
    unit: d.unit,
    testDate: typeof d.testDate === 'string' ? d.testDate : new Date(d.testDate).toISOString(),
    notes: d.notes,
    source: d.source,
  };
}

function mapMed(d: any): Medication {
  return {
    id: String(d._id || d.id),
    name: d.name,
    dosage: d.dosage,
    frequency: d.frequency,
    startDate: typeof d.startDate === 'string' ? d.startDate : new Date(d.startDate).toISOString(),
    indication: d.indication,
    notes: d.notes,
  };
}

function mapAdherence(d: any): MedicationAdherence {
  return {
    id: String(d._id || d.id),
    medicationId: String(d.medicationId),
    date: d.date,
    taken: d.taken,
    notes: d.notes,
    timestamp: typeof d.timestamp === 'string' ? d.timestamp : new Date(d.timestamp).toISOString(),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [bpLogs, setBpLogs] = useState<BPLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [biomarkers, setBiomarkers] = useState<BiomarkerLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<MedicationAdherence[]>([]);

  const refreshLogs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { logs } = await api.listLogs(user.id, { limit: 500 });
      const { weights, bps, foods, exercises } = mapLogs(logs);
      setWeightLogs(weights);
      setBpLogs(bps);
      setFoodLogs(foods);
      setExerciseLogs(exercises);
    } catch (e) { console.error(e); }
  }, [user?.id]);

  const refreshBiomarkers = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { biomarkers } = await api.listBiomarkers(user.id);
      setBiomarkers(biomarkers.map(mapBiomarker));
    } catch (e) { console.error(e); }
  }, [user?.id]);

  const refreshMeds = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [{ medications }, { adherence }] = await Promise.all([
        api.listMedications(user.id),
        api.listAdherence(user.id),
      ]);
      setMedications(medications.map(mapMed));
      setAdherence(adherence.map(mapAdherence));
    } catch (e) { console.error(e); }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshLogs(), refreshBiomarkers(), refreshMeds()]);
  }, [refreshLogs, refreshBiomarkers, refreshMeds]);

  useEffect(() => { if (user?.id) refresh(); }, [user?.id, refresh]);

  return (
    <Ctx.Provider value={{ weightLogs, bpLogs, foodLogs, exerciseLogs, biomarkers, medications, adherence, refresh, refreshBiomarkers, refreshMeds }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData outside DataProvider');
  return ctx;
}
