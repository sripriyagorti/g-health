import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatTrendChartProps {
  type: 'weight' | 'bp' | 'calories' | 'biomarker';
  data: any[];
  marker_type?: string;
}

function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateTrend(data: any[], getValue: (d: any) => number): { trend: 'up' | 'down' | 'stable'; delta: number } {
  if (data.length < 2) return { trend: 'stable', delta: 0 };
  const first = getValue(data[0]);
  const last = getValue(data[data.length - 1]);
  const delta = last - first;
  const trend = Math.abs(delta) < 1 ? 'stable' : delta > 0 ? 'up' : 'down';
  return { trend, delta };
}

function getTrendColor(type: string, trend: 'up' | 'down' | 'stable'): { bg: string; text: string; icon: string } {
  if (type === 'weight') {
    if (trend === 'down') return { bg: 'bg-good-50', text: 'text-good-700', icon: 'text-good-600' };
    if (trend === 'up') return { bg: 'bg-warn-50', text: 'text-warn-700', icon: 'text-warn-600' };
    return { bg: 'bg-surface-muted', text: 'text-ink-muted', icon: 'text-ink-soft' };
  }
  return { bg: 'bg-brand-50', text: 'text-brand-700', icon: 'text-brand-600' };
}

export function ChatTrendChart({ type, data, marker_type }: ChatTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-ink-muted">
        No data available yet
      </div>
    );
  }

  if (type === 'weight') {
    const chartData = data.map(d => ({
      date: formatDate(d.timestamp),
      weight: d.data?.weight || 0,
    }));
    const { trend, delta } = calculateTrend(chartData, d => d.weight);
    const first = chartData[0]?.weight;
    const last = chartData[chartData.length - 1]?.weight;
    const colors = getTrendColor('weight', trend);

    return (
      <div className="space-y-4">
        <div className={cn('p-4 rounded-2xl border', colors.bg, 'border-transparent')}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Current weight</p>
              <p className="text-2xl font-bold text-ink mt-1">{last.toFixed(1)} <span className="text-base text-ink-muted">kg</span></p>
            </div>
            <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', colors.bg, colors.text)}>
              {trend === 'down' && <TrendingDown size={14} className={colors.icon} />}
              {trend === 'up' && <TrendingUp size={14} className={colors.icon} />}
              {trend === 'stable' && <Minus size={14} className={colors.icon} />}
              <span>{Math.abs(delta).toFixed(1)} kg</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            {trend === 'down' ? '↓ Trending down' : trend === 'up' ? '↑ Trending up' : '→ Stable'}
          </p>
        </div>

        <div className="bg-surface-muted/50 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 10 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '12px', fontSize: '12px', boxShadow: 'var(--shadow-sm)' }}
                cursor={{ stroke: 'var(--color-brand-200)', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="weight" stroke="var(--color-brand-600)" fill="url(#weightGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'bp') {
    const chartData = data.map(d => ({
      date: formatDate(d.timestamp),
      systolic: d.data?.systolic || 0,
      diastolic: d.data?.diastolic || 0,
    }));
    const latest = chartData[chartData.length - 1];
    const isNormal = latest?.systolic <= 120 && latest?.diastolic <= 80;
    const isElevated = latest?.systolic > 120 && latest?.systolic < 130;
    const isHigh = latest?.systolic >= 130 || latest?.diastolic >= 90;

    let statusColor = 'bg-good-50 border-good-200 text-good-700';
    let statusLabel = 'Normal';
    if (isHigh) {
      statusColor = 'bg-bad-50 border-bad-200 text-bad-700';
      statusLabel = 'High';
    } else if (isElevated) {
      statusColor = 'bg-warn-50 border-warn-200 text-warn-700';
      statusLabel = 'Elevated';
    }

    return (
      <div className="space-y-4">
        <div className={cn('p-4 rounded-2xl border', statusColor.split(' ')[0], statusColor.split(' ')[1])}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Blood pressure</p>
              <p className="text-2xl font-bold text-ink mt-1">{latest?.systolic}/{latest?.diastolic} <span className="text-base text-ink-muted">mmHg</span></p>
            </div>
            <div className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border', statusColor)}>
              {statusLabel}
            </div>
          </div>
          <p className="text-xs text-ink-muted">Goal: 120/80 or lower</p>
        </div>

        <div className="bg-surface-muted/50 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} domain={[60, 160]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '12px', fontSize: '12px', boxShadow: 'var(--shadow-sm)' }}
                cursor={{ stroke: 'var(--color-brand-200)', strokeWidth: 2 }}
              />
              <Line type="monotone" dataKey="systolic" stroke="var(--color-brand-600)" name="Systolic" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="diastolic" stroke="var(--color-info-500)" name="Diastolic" dot={false} strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'calories') {
    const chartData = data.map(d => ({
      date: d.date,
      calories: d.calories || 0,
    }));
    const avg = Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length);
    const latest = chartData[chartData.length - 1];

    return (
      <div className="space-y-4">
        <div className="bg-warn-50 border border-warn-100 p-4 rounded-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Daily intake</p>
              <p className="text-2xl font-bold text-ink mt-1">{latest?.calories || 0} <span className="text-base text-ink-muted">kcal</span></p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs text-ink-muted">Average</div>
              <div className="font-semibold text-sm text-ink">{avg} kcal</div>
            </div>
          </div>
        </div>

        <div className="bg-surface-muted/50 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 10 }}>
              <defs>
                <linearGradient id="calorieGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-warn-600)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-warn-600)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '12px', fontSize: '12px', boxShadow: 'var(--shadow-sm)' }}
                cursor={{ stroke: 'var(--color-warn-200)', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="calories" stroke="var(--color-warn-600)" fill="url(#calorieGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'biomarker') {
    const chartData = data.map(d => ({
      date: formatDate(d.testDate),
      value: d.value || 0,
    }));
    const { trend, delta } = calculateTrend(chartData, d => d.value);
    const latest = chartData[chartData.length - 1];

    const isBetter = (marker_type && marker_type.includes('glucose')) ? delta < 0 : delta < 0;
    const trendColor = isBetter
      ? 'bg-good-50 border-good-200 text-good-700'
      : 'bg-warn-50 border-warn-200 text-warn-700';

    return (
      <div className="space-y-4">
        <div className={cn('p-4 rounded-2xl border', trendColor.split(' ').slice(0, 2).join(' '))}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {marker_type?.replace(/_/g, ' ')}
              </p>
              <p className="text-2xl font-bold text-ink mt-1">{latest?.value}</p>
            </div>
            <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border', trendColor)}>
              {trend === 'down' && <TrendingDown size={14} />}
              {trend === 'up' && <TrendingUp size={14} />}
              {trend === 'stable' && <Minus size={14} />}
              <span>{Math.abs(delta).toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-muted/50 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 10 }}>
              <defs>
                <linearGradient id="bioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-info-600)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-info-600)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '12px', fontSize: '12px', boxShadow: 'var(--shadow-sm)' }}
                cursor={{ stroke: 'var(--color-info-200)', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="value" stroke="var(--color-info-600)" fill="url(#bioGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
}
