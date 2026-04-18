import { Check, X, Utensils, Scale, Activity, Stethoscope, Droplets, Pill } from 'lucide-react';
import { Button } from './ui/Button';
import { IconBadge } from './ui/IconBadge';
import type { PendingFunctionCall } from '../types';

interface Props {
  call: PendingFunctionCall;
  confirmed?: boolean;
  cancelled?: boolean;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}

const META: Record<string, { title: string; tone: any; icon: any }> = {
  log_meal: { title: 'Meal', tone: 'accent', icon: Utensils },
  log_weight: { title: 'Weight', tone: 'brand', icon: Scale },
  log_bp: { title: 'Blood Pressure', tone: 'info', icon: Stethoscope },
  log_exercise: { title: 'Exercise', tone: 'good', icon: Activity },
  log_biomarker: { title: 'Biomarker', tone: 'warn', icon: Droplets },
  log_medication_adherence: { title: 'Medication', tone: 'brand', icon: Pill },
};

function formatLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
}

function renderSummary(name: string, args: Record<string, any>) {
  if (name === 'log_meal') {
    return (
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-ink">{args.meal_name}</p>
        <p className="text-sm text-ink-muted">{args.portion_size} · {args.calories} kcal</p>
        {(args.protein_g || args.carbs_g || args.fat_g) && (
          <div className="flex gap-3 text-[11px] text-ink-soft">
            {args.protein_g ? <span>P {args.protein_g}g</span> : null}
            {args.carbs_g ? <span>C {args.carbs_g}g</span> : null}
            {args.fat_g ? <span>F {args.fat_g}g</span> : null}
            {args.fiber_g ? <span>Fiber {args.fiber_g}g</span> : null}
            {args.sodium_mg ? <span>Na {args.sodium_mg}mg</span> : null}
          </div>
        )}
      </div>
    );
  }
  if (name === 'log_weight') {
    return <p className="text-base font-semibold text-ink">{args.weight_kg} kg</p>;
  }
  if (name === 'log_bp') {
    return <p className="text-base font-semibold text-ink">{args.systolic} / {args.diastolic} mmHg</p>;
  }
  if (name === 'log_exercise') {
    return (
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink capitalize">{args.exercise_type}</p>
        <p className="text-sm text-ink-muted">{args.duration_minutes} min {args.intensity ? `· ${args.intensity}` : ''}</p>
      </div>
    );
  }
  if (name === 'log_biomarker') {
    return (
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink capitalize">{formatLabel(args.marker_type || '')}</p>
        <p className="text-sm text-ink-muted">{args.value} {args.unit} · {args.test_date}</p>
      </div>
    );
  }
  if (name === 'log_medication_adherence') {
    return (
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink">{args.medication_name}</p>
        <p className="text-sm text-ink-muted">{args.taken ? 'Taken' : 'Missed'} · {args.date}</p>
      </div>
    );
  }
  return (
    <div className="text-xs font-mono space-y-0.5">
      {Object.entries(args).map(([k, v]) => (
        <div key={k}><span className="font-semibold">{k}:</span> {String(v)}</div>
      ))}
    </div>
  );
}

export function GenerativeUICard({ call, confirmed, cancelled, onConfirm, onCancel }: Props) {
  const meta = META[call.name] || { title: call.name, tone: 'neutral', icon: Check };
  const Icon = meta.icon;

  return (
    <div className="bg-surface border border-line rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)] space-y-3 animate-fadeUp">
      <div className="flex items-center gap-3">
        <IconBadge tone={meta.tone} size="sm"><Icon size={16} /></IconBadge>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{confirmed ? 'Logged' : cancelled ? 'Cancelled' : 'Ready to log'}</p>
          <p className="text-sm font-semibold text-ink">{meta.title}</p>
        </div>
      </div>
      <div className="pl-1">{renderSummary(call.name, call.args)}</div>
      {!confirmed && !cancelled && (
        <div className="flex gap-2 pt-1">
          <Button variant="primary" size="sm" fullWidth leftIcon={<Check size={14} />} onClick={() => onConfirm(call.id)}>Confirm</Button>
          <Button variant="secondary" size="sm" fullWidth leftIcon={<X size={14} />} onClick={() => onCancel(call.id)}>Cancel</Button>
        </div>
      )}
      {confirmed && (
        <div className="flex items-center gap-1.5 text-good-700 text-xs font-semibold">
          <Check size={14} /> Saved
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-1.5 text-ink-soft text-xs font-semibold">
          <X size={14} /> Dismissed
        </div>
      )}
    </div>
  );
}
