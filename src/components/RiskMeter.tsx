import { motion } from 'motion/react';
import type { RiskLevel } from '../types';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';

interface RiskMeterProps {
  label: string;
  level: RiskLevel;
  score?: string;
}

export function RiskMeter({ label, level, score }: RiskMeterProps) {
  const fill = level === 'Low' ? 'bg-good-500' : level === 'Moderate' ? 'bg-warn-500' : 'bg-bad-500';
  const tone = level === 'Low' ? 'good' : level === 'Moderate' ? 'warn' : 'bad';
  const width = score || (level === 'Low' ? '25%' : level === 'Moderate' ? '60%' : '90%');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-ink">{label}</span>
        <div className="flex items-center gap-2">
          {score && <span className="text-xs font-bold text-ink-muted">{score}</span>}
          <Badge tone={tone as any}>{level}</Badge>
        </div>
      </div>
      <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', fill)}
        />
      </div>
    </div>
  );
}
