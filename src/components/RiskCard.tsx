import { Card } from './ui/Card';
import { RiskMeter } from './RiskMeter';
import type { RiskLevel } from '../types';

interface RiskCardProps {
  diabetes: number;
  hypertension: number;
  cvd: number;
}

function toLevel(score: number): RiskLevel {
  if (score > 50) return 'High';
  if (score > 20) return 'Moderate';
  return 'Low';
}

export function RiskCard({ diabetes, hypertension, cvd }: RiskCardProps) {
  return (
    <Card className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-bold text-ink">Cardiometabolic Risk</h3>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Live</span>
      </div>
      <div className="space-y-4">
        <RiskMeter label="Type 2 Diabetes" level={toLevel(diabetes)} score={`${diabetes.toFixed(0)}%`} />
        <RiskMeter label="Hypertension" level={toLevel(hypertension)} score={`${hypertension.toFixed(0)}%`} />
        <RiskMeter label="Cardiovascular" level={toLevel(cvd)} score={`${cvd.toFixed(0)}%`} />
      </div>
    </Card>
  );
}
