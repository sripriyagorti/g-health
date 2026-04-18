import { Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MedicationAdherence } from '../types';

interface Props {
  medicationId: string;
  adherence: MedicationAdherence[];
  days?: number;
  onToggle: (date: string, current: boolean | undefined) => void;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function MedicationAdherenceWidget({ medicationId, adherence, days = 7, onToggle }: Props) {
  const today = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(isoDate(d));
  }

  const byDate = new Map<string, boolean>();
  for (const a of adherence) {
    if (a.medicationId === medicationId) byDate.set(a.date, a.taken);
  }

  const taken = dates.filter(d => byDate.get(d) === true).length;
  const logged = dates.filter(d => byDate.has(d)).length;
  const pct = logged > 0 ? Math.round((taken / days) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          Last {days} days · {pct}% taken
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {dates.map(d => {
          const state = byDate.get(d);
          return (
            <button
              key={d}
              onClick={() => onToggle(d, state)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition-all active:scale-95',
                state === true && 'bg-good-500 text-white',
                state === false && 'bg-bad-500 text-white',
                state === undefined && 'bg-surface-muted text-ink-muted hover:bg-line'
              )}
              title={d}
            >
              <span>{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })[0]}</span>
              {state === true && <Check size={12} />}
              {state === false && <X size={12} />}
              {state === undefined && <span className="text-[9px]">{new Date(d).getDate()}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
