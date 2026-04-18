import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Trash2 } from 'lucide-react';
import type { BiomarkerLog } from '../types';

const RANGES: Record<string, { label: string; optimal: [number, number]; unit: string }> = {
  fasting_glucose: { label: 'Fasting Glucose', optimal: [70, 99], unit: 'mg/dL' },
  total_cholesterol: { label: 'Total Cholesterol', optimal: [0, 200], unit: 'mg/dL' },
  hdl: { label: 'HDL', optimal: [40, 200], unit: 'mg/dL' },
  ldl: { label: 'LDL', optimal: [0, 100], unit: 'mg/dL' },
  triglycerides: { label: 'Triglycerides', optimal: [0, 150], unit: 'mg/dL' },
  crp: { label: 'CRP', optimal: [0, 3], unit: 'mg/L' },
  homocysteine: { label: 'Homocysteine', optimal: [5, 15], unit: 'µmol/L' },
  uric_acid: { label: 'Uric Acid', optimal: [3.5, 7.2], unit: 'mg/dL' },
  hba1c: { label: 'HbA1c', optimal: [0, 5.7], unit: '%' },
};

interface BiomarkerCardProps {
  biomarker: BiomarkerLog;
  onDelete?: (id: string) => void;
}

export function BiomarkerCard({ biomarker, onDelete }: BiomarkerCardProps) {
  const meta = RANGES[biomarker.markerType] || { label: biomarker.markerType, optimal: [0, 0] as [number, number], unit: biomarker.unit };
  const [lo, hi] = meta.optimal;
  const inRange = biomarker.value >= lo && biomarker.value <= hi;
  const slightlyOut = !inRange && (
    biomarker.value < lo * 0.85 || biomarker.value > hi * 1.25
  );
  const tone = inRange ? 'good' : slightlyOut ? 'bad' : 'warn';
  const status = inRange ? 'In range' : slightlyOut ? 'Out of range' : 'Borderline';

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">{meta.label}</h4>
          <p className="text-[11px] text-ink-soft mt-0.5">Optimal: {lo}–{hi} {meta.unit}</p>
        </div>
        <Badge tone={tone as any}>{status}</Badge>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-ink">{biomarker.value}</span>
        <span className="text-sm text-ink-muted">{biomarker.unit}</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-line">
        <span className="text-[11px] text-ink-soft">{new Date(biomarker.testDate).toLocaleDateString()}</span>
        {onDelete && (
          <button onClick={() => onDelete(biomarker.id)} className="text-ink-soft hover:text-bad-500 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </Card>
  );
}
