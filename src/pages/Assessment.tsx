import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Heart, Zap, Footprints, Flame, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { calculateRiskScores } from '../utils/riskCalculations';
import { RiskCard } from '../components/RiskCard';
import { cn } from '../lib/utils';
import type { UserData } from '../types';

interface Props {
  isFirstTime: boolean;
  onDone: () => void;
}

const CUISINES = ['South Indian', 'North Indian', 'Pakistani', 'Bengali', 'Sri Lankan', 'Nepali', 'Other'];
const EXERCISE_OPTS = ['Walking', 'Yoga', 'Gym', 'Cycling', 'Running', 'Swimming', 'Sports'];

const ACTIVITY_LEVELS = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    icon: Footprints,
    desc: 'Mostly sitting — desk job, minimal movement',
    example: 'e.g. Office work, watching TV most evenings',
    color: 'text-ink-muted',
    bg: 'bg-surface-muted',
    activeBg: 'bg-bad-50 border-bad-300',
    activeText: 'text-bad-700',
  },
  {
    value: 'light',
    label: 'Light',
    icon: Footprints,
    desc: '1–3 days/week of light activity',
    example: 'e.g. Casual walks, light household chores',
    color: 'text-warn-700',
    bg: 'bg-surface-muted',
    activeBg: 'bg-warn-50 border-warn-300',
    activeText: 'text-warn-700',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    icon: Zap,
    desc: '3–5 days/week of moderate exercise',
    example: 'e.g. Brisk walks, yoga, cycling, light gym',
    color: 'text-brand-700',
    bg: 'bg-surface-muted',
    activeBg: 'bg-brand-50 border-brand-300',
    activeText: 'text-brand-700',
  },
  {
    value: 'active',
    label: 'Very Active',
    icon: Flame,
    desc: 'Daily vigorous exercise or physical job',
    example: 'e.g. Running, gym 5+ days, sports, manual labour',
    color: 'text-good-700',
    bg: 'bg-surface-muted',
    activeBg: 'bg-good-50 border-good-300',
    activeText: 'text-good-700',
  },
];

const GENDER_OPTS = [
  { value: 'male', label: 'Male', emoji: '♂' },
  { value: 'female', label: 'Female', emoji: '♀' },
  { value: 'other', label: 'Other', emoji: '⚧' },
];

const STEPS_FIRST = ['About you', 'Your body', 'Activity', 'Health history', 'Optional labs', 'Your risk'];
const STEPS_EDIT = ['About you', 'Your body', 'Activity', 'Health history', 'Optional labs'];

function StepHeading({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700 mb-4">
          <Icon size={22} />
        </div>
      )}
      <h2 className="text-2xl font-bold text-ink leading-tight">{title}</h2>
      {subtitle && <p className="text-sm text-ink-muted mt-1.5 leading-snug">{subtitle}</p>}
    </div>
  );
}

function Chip({
  label, active, onClick, color = 'brand',
}: { label: string; active: boolean; onClick: () => void; color?: 'brand' | 'accent' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150',
        active && color === 'brand' ? 'bg-brand-600 text-white border-brand-600 shadow-sm' :
        active && color === 'accent' ? 'bg-accent-500 text-white border-accent-500 shadow-sm' :
        'bg-surface border-line text-ink-muted hover:border-brand-300 hover:text-ink'
      )}
    >
      {label}
    </motion.button>
  );
}

function NumberField({
  label, value, unit, onChange, min = 0, max = 999, step = 1,
}: { label: string; value: number | undefined; unit: string; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</label>
      <div className="flex items-center gap-3 bg-surface-muted rounded-2xl px-4 py-3 border border-line focus-within:border-brand-400">
        <input
          type="number"
          min={min} max={max} step={step}
          value={value ?? ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 bg-transparent text-xl font-bold text-ink outline-none w-0 min-w-0"
        />
        <span className="text-sm text-ink-soft shrink-0">{unit}</span>
      </div>
    </div>
  );
}

export function Assessment({ isFirstTime, onDone }: Props) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<UserData & { name: string }>>({
    name: user?.name ?? '',
    age: user?.age ?? undefined,
    gender: user?.gender ?? 'male',
    height: user?.height ?? undefined,
    weight: user?.weight ?? undefined,
    waist: user?.waist ?? undefined,
    systolicBP: user?.systolicBP ?? undefined,
    diastolicBP: user?.diastolicBP ?? undefined,
    fastingGlucose: user?.fastingGlucose ?? undefined,
    hdl: user?.hdl ?? undefined,
    ldl: user?.ldl ?? undefined,
    triglycerides: user?.triglycerides ?? undefined,
    activityLevel: user?.activityLevel ?? 'light',
    familyHistory: user?.familyHistory ?? false,
    cuisinePrefs: user?.cuisinePrefs ?? [],
    exercisePrefs: user?.exercisePrefs ?? [],
  });

  const steps = isFirstTime ? STEPS_FIRST : STEPS_EDIT;
  const isLast = step === steps.length - 1;

  // AI summary for final step
  const [aiSummary, setAiSummary] = useState<Array<{ insight: string; action: string }>>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const summaryFetched = useRef(false);

  function patch(p: Partial<typeof data>) {
    setData(prev => ({ ...prev, ...p }));
  }

  function toggleList(key: 'cuisinePrefs' | 'exercisePrefs', item: string) {
    setData(prev => {
      const cur = (prev[key] as string[]) || [];
      return { ...prev, [key]: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item] };
    });
  }

  function go(nextStep: number) {
    setDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
    // Fetch AI summary when reaching last step (first-time)
    if (isFirstTime && nextStep === steps.length - 1 && !summaryFetched.current) {
      summaryFetched.current = true;
      setSummaryLoading(true);
      api.profileSummary(data).then(r => { setAiSummary(r.bullets || []); }).finally(() => setSummaryLoading(false));
    }
  }

  const risks = useMemo(() => {
    const derived = { weightSlope: 0, act7: 0, avgSBP: data.systolicBP || 0, avgDBP: data.diastolicBP || 0, avgCal: 0 };
    return calculateRiskScores(data, derived);
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      await updateUser(data);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-surface/95 backdrop-blur-md border-b border-line z-10 px-5 md:px-10 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
              {isFirstTime ? `Step ${step + 1} of ${steps.length}` : 'Edit profile'}
            </p>
            {!isFirstTime && (
              <button onClick={onDone} className="text-xs font-semibold text-ink-muted hover:text-ink">Cancel</button>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === step ? 24 : 6, opacity: i <= step ? 1 : 0.3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn('h-1.5 rounded-full', i <= step ? 'bg-brand-600' : 'bg-line')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 md:px-10 py-8 pb-32">
        <div className="max-w-lg mx-auto">
          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              {/* STEP 0: About you */}
              {step === 0 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Let's start with you"
                    subtitle="This helps us personalise your risk assessment and tips."
                  />
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft block mb-2">Your name</label>
                      <input
                        type="text"
                        value={data.name ?? ''}
                        onChange={e => patch({ name: e.target.value })}
                        placeholder="e.g. Priya"
                        className="w-full text-xl font-semibold text-ink bg-surface-muted rounded-2xl px-4 py-3 border border-line focus:border-brand-400 outline-none placeholder:text-ink-soft placeholder:font-normal"
                      />
                    </div>
                    <NumberField label="Age" value={data.age} unit="years" onChange={v => patch({ age: v })} min={10} max={100} />
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft block mb-2">Gender</label>
                      <div className="grid grid-cols-3 gap-2">
                        {GENDER_OPTS.map(g => (
                          <motion.button
                            key={g.value}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => patch({ gender: g.value as any })}
                            className={cn(
                              'flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 text-sm font-semibold transition-all',
                              data.gender === g.value
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-line bg-surface text-ink-muted hover:border-brand-200'
                            )}
                          >
                            <span className="text-xl">{g.emoji}</span>
                            {g.label}
                            {data.gender === g.value && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: Body */}
              {step === 1 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Your body measurements"
                    subtitle="Used to calculate BMI, waist-to-height ratio, and metabolic risk."
                  />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField label="Height" value={data.height} unit="cm" onChange={v => patch({ height: v })} min={100} max={220} />
                      <NumberField label="Weight" value={data.weight} unit="kg" onChange={v => patch({ weight: v })} min={30} max={250} />
                    </div>
                    <NumberField label="Waist circumference" value={data.waist} unit="cm" onChange={v => patch({ waist: v })} min={40} max={180} />
                    <div className="bg-brand-50 rounded-2xl px-4 py-3 text-xs text-brand-800 leading-snug">
                      <span className="font-bold">Waist tip:</span> Measure at belly button level, after exhaling. Waist {">"} 90 cm (men) or {">"} 80 cm (women) raises risk in South Asians.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Activity level */}
              {step === 2 && (
                <div className="space-y-5">
                  <StepHeading
                    title="How active are you?"
                    subtitle="Pick the level that best describes your average week."
                  />
                  <div className="space-y-3">
                    {ACTIVITY_LEVELS.map(lvl => {
                      const Icon = lvl.icon;
                      const active = data.activityLevel === lvl.value;
                      return (
                        <motion.button
                          key={lvl.value}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => patch({ activityLevel: lvl.value as any })}
                          className={cn(
                            'w-full text-left rounded-2xl border-2 p-4 transition-all duration-150',
                            active ? `${lvl.activeBg} shadow-sm` : 'border-line bg-surface hover:border-brand-200'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', active ? lvl.activeBg : 'bg-surface-muted')}>
                              <Icon size={16} className={active ? lvl.activeText : 'text-ink-soft'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn('font-bold text-sm', active ? lvl.activeText : 'text-ink')}>{lvl.label}</p>
                                {active && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                                    <Check size={10} className="text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-sm text-ink-muted mt-0.5">{lvl.desc}</p>
                              <p className="text-[11px] text-ink-soft mt-1 italic">{lvl.example}</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Health history */}
              {step === 3 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Family & food habits"
                    subtitle="Family history is one of the strongest predictors of cardiometabolic risk."
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => patch({ familyHistory: !data.familyHistory })}
                    className={cn(
                      'w-full text-left rounded-2xl border-2 p-4 transition-all duration-150',
                      data.familyHistory ? 'border-bad-400 bg-bad-50' : 'border-line bg-surface hover:border-brand-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', data.familyHistory ? 'bg-bad-100' : 'bg-surface-muted')}>
                        <Heart size={16} className={data.familyHistory ? 'text-bad-600' : 'text-ink-soft'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn('font-bold text-sm', data.familyHistory ? 'text-bad-700' : 'text-ink')}>Family history of chronic disease</p>
                          {data.familyHistory && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-ink-muted mt-0.5">Diabetes, hypertension, or heart disease in parents or siblings</p>
                        <p className="text-[11px] text-ink-soft mt-1 italic">This increases your risk and helps us tailor advice</p>
                      </div>
                    </div>
                  </motion.button>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Favourite cuisines</p>
                      <div className="flex flex-wrap gap-2">
                        {CUISINES.map(c => (
                          <Chip key={c} label={c} active={!!data.cuisinePrefs?.includes(c)} onClick={() => toggleList('cuisinePrefs', c)} color="brand" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Exercise you enjoy</p>
                      <div className="flex flex-wrap gap-2">
                        {EXERCISE_OPTS.map(e => (
                          <Chip key={e} label={e} active={!!data.exercisePrefs?.includes(e)} onClick={() => toggleList('exercisePrefs', e)} color="accent" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Optional labs */}
              {step === 4 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Lab results (optional)"
                    subtitle="Leave blank if you don't have recent results — you can add them later in Biomarkers."
                  />
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField label="Systolic BP" value={data.systolicBP} unit="mmHg" onChange={v => patch({ systolicBP: v })} min={60} max={220} />
                      <NumberField label="Diastolic BP" value={data.diastolicBP} unit="mmHg" onChange={v => patch({ diastolicBP: v })} min={40} max={140} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField label="Fasting glucose" value={data.fastingGlucose} unit="mg/dL" onChange={v => patch({ fastingGlucose: v })} min={50} max={400} />
                      <NumberField label="HDL cholesterol" value={data.hdl} unit="mg/dL" onChange={v => patch({ hdl: v })} min={10} max={120} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField label="LDL cholesterol" value={data.ldl} unit="mg/dL" onChange={v => patch({ ldl: v })} min={30} max={400} />
                      <NumberField label="Triglycerides" value={data.triglycerides} unit="mg/dL" onChange={v => patch({ triglycerides: v })} min={30} max={1000} />
                    </div>
                  </div>
                  <p className="text-xs text-ink-soft text-center">All values optional · You can update anytime in Labs</p>
                </div>
              )}

              {/* STEP 5: Risk reveal + AI summary (first-time only) */}
              {step === 5 && isFirstTime && (
                <div className="space-y-5">
                  <StepHeading
                    title="Your baseline profile"
                    subtitle="Here's what your data tells us. It improves as you log meals, vitals, and activity."
                  />
                  <RiskCard
                    diabetes={parseFloat(risks.diabetes)}
                    hypertension={parseFloat(risks.hypertension)}
                    cvd={parseFloat(risks.cvd)}
                  />

                  {/* AI Coach Summary */}
                  <div className="rounded-2xl border border-brand-200 bg-brand-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-200">
                      <div className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                      </div>
                      <p className="text-sm font-bold text-brand-900">Personalised insights from your coach</p>
                    </div>

                    {summaryLoading ? (
                      <div className="flex items-center gap-3 px-4 py-5 text-brand-700">
                        <Loader2 size={16} className="animate-spin shrink-0" />
                        <p className="text-sm">Analysing your profile…</p>
                      </div>
                    ) : aiSummary.length > 0 ? (
                      <div className="divide-y divide-brand-100">
                        {aiSummary.map((b, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.12 }}
                            className="px-4 py-3 space-y-0.5"
                          >
                            <p className="text-sm text-brand-900 font-medium leading-snug">{b.insight}</p>
                            <p className="text-xs text-brand-700 flex items-start gap-1.5">
                              <span className="mt-0.5 shrink-0">→</span>
                              {b.action}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-3 text-sm text-brand-800 leading-relaxed">
                        Chat with the AI coach to log meals, BP, and activity. Each entry refines your risk score using validated clinical formulas.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="shrink-0 bg-surface border-t border-line px-5 md:px-10 py-4">
        <div className="max-w-lg mx-auto flex gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => go(step - 1)} leftIcon={<ChevronLeft size={16} />}>Back</Button>
          )}
          {!isLast ? (
            <Button variant="primary" size="lg" fullWidth onClick={() => go(step + 1)} rightIcon={<ChevronRight size={16} />}>Continue</Button>
          ) : (
            <Button variant="primary" size="lg" fullWidth loading={saving} onClick={save}>
              {isFirstTime ? 'Get started →' : 'Save changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
