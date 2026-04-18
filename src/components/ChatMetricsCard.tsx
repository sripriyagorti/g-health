import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'elevated' | 'high' | 'info';
  trend?: 'up' | 'down' | 'stable';
}

interface ChatMetricsCardProps {
  title: string;
  subtitle?: string;
  metrics: MetricItem[];
  action?: string;
}

function statusColor(status?: string): string {
  switch (status) {
    case 'high': return 'text-bad-600';
    case 'elevated': return 'text-warn-600';
    case 'normal': return 'text-good-600';
    default: return 'text-ink-muted';
  }
}

function statusBg(status?: string): string {
  switch (status) {
    case 'high': return 'bg-bad-50 border-bad-200';
    case 'elevated': return 'bg-warn-50 border-warn-200';
    case 'normal': return 'bg-good-50 border-good-200';
    default: return 'bg-surface-muted border-line';
  }
}

function TrendIcon({ trend, status }: { trend?: string; status?: string }) {
  const color = statusColor(status);
  if (trend === 'up') return <TrendingUp size={14} className={color} />;
  if (trend === 'down') return <TrendingDown size={14} className={color} />;
  return <Minus size={14} className="text-ink-soft" />;
}

export function ChatMetricsCard({ title, subtitle, metrics, action }: ChatMetricsCardProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4 space-y-3 max-w-sm">
      <div>
        <p className="font-semibold text-sm text-ink">{title}</p>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm', statusBg(m.status))}>
            <div className="flex-1">
              <p className="text-xs text-ink-muted">{m.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('font-semibold', statusColor(m.status))}>
                  {m.value}{m.unit ? ` ${m.unit}` : ''}
                </span>
                <TrendIcon trend={m.trend} status={m.status} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {action && (
        <p className="text-xs text-ink-soft px-3 py-2 bg-surface-muted rounded-lg flex items-center gap-1.5">
          <AlertCircle size={13} className="text-brand-600 shrink-0" />
          {action}
        </p>
      )}
    </div>
  );
}

// Helper to build metrics from recent logs
export function buildWeightMetric(current?: number, previous?: number): MetricItem {
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let status: 'normal' | 'info' = 'info';
  if (previous && current) {
    if (current < previous - 0.3) trend = 'down';
    else if (current > previous + 0.3) trend = 'up';
  }
  return { label: 'Current weight', value: current?.toFixed(1) || '—', unit: 'kg', trend, status };
}

export function buildBPMetric(systolic?: number, diastolic?: number): MetricItem[] {
  let status: 'normal' | 'elevated' | 'high' = 'normal';
  if (systolic && systolic >= 140) status = 'high';
  else if (systolic && systolic >= 130) status = 'elevated';

  return [
    { label: 'Systolic (top)', value: systolic || '—', unit: 'mmHg', status },
    { label: 'Diastolic (bottom)', value: diastolic || '—', unit: 'mmHg', status },
  ];
}

export function buildGlucoseMetric(value?: number): MetricItem {
  let status: 'normal' | 'elevated' | 'high' = 'normal';
  if (value && value >= 126) status = 'high';
  else if (value && value >= 100) status = 'elevated';

  return { label: 'Fasting glucose', value: value || '—', unit: 'mg/dL', status };
}
