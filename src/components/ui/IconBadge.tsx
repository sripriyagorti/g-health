import React from 'react';
import { cn } from '../../lib/utils';

type Tone = 'brand' | 'accent' | 'info' | 'good' | 'warn' | 'bad' | 'neutral';

const TONE: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-accent-50 text-accent-600',
  info: 'bg-info-50 text-info-700',
  good: 'bg-good-50 text-good-700',
  warn: 'bg-warn-50 text-warn-700',
  bad: 'bg-bad-50 text-bad-700',
  neutral: 'bg-surface-muted text-ink-muted',
};

interface IconBadgeProps {
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function IconBadge({ tone = 'brand', size = 'md', children, className }: IconBadgeProps) {
  const s = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  return (
    <div className={cn('inline-flex items-center justify-center rounded-2xl', s, TONE[tone], className)}>
      {children}
    </div>
  );
}
