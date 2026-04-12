import { motion } from 'motion/react';
import { RiskLevel } from '../types';
import { cn } from '../lib/utils';

interface RiskMeterProps {
  label: string;
  level: RiskLevel;
  score?: string;
}

export function RiskMeter({ label, level, score }: RiskMeterProps) {
  const colors = {
    Low: 'bg-emerald-500',
    Moderate: 'bg-amber-500',
    High: 'bg-rose-500',
  };

  const percentages = {
    Low: 25,
    Moderate: 60,
    High: 90,
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center space-x-2">
          {score && <span className="text-xs font-bold text-slate-500">{score}</span>}
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
            level === 'Low' ? 'bg-emerald-100 text-emerald-700' :
            level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
            'bg-rose-100 text-rose-700'
          )}>
            {level}
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: score ? `${score}` : `${percentages[level]}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", colors[level])}
        />
      </div>
    </div>
  );
}
