import React from 'react';
import { cn } from '../../lib/utils';

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral' | 'brand';

const TONE: Record<Tone, string> = {
  good: 'bg-good-50 text-good-700',
  warn: 'bg-warn-50 text-warn-700',
  bad: 'bg-bad-50 text-bad-700',
  info: 'bg-info-50 text-info-700',
  neutral: 'bg-surface-muted text-ink-muted',
  brand: 'bg-brand-50 text-brand-700',
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide', TONE[tone], className)}>
      {children}
    </span>
  );
}
