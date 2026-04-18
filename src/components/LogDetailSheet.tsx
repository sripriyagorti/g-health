import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Stethoscope, Activity, Utensils, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export type DetailType = 'weight' | 'bp' | 'activity' | 'calories';

const META: Record<DetailType, { label: string; icon: any; color: string; unit: string }> = {
  weight:   { label: 'Weight',          icon: Scale,       color: '#6366f1', unit: 'kg' },
  bp:       { label: 'Blood Pressure',  icon: Stethoscope, color: '#0ea5e9', unit: 'mmHg' },
  activity: { label: 'Activity',        icon: Activity,    color: '#10b981', unit: 'min' },
  calories: { label: 'Calories',        icon: Utensils,    color: '#f59e0b', unit: 'kcal' },
};

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function tip(type: DetailType, data: any[]): string | null {
  if (!data.length) return null;
  if (type === 'weight') {
    if (data.length < 2) return 'Log weight regularly to track your trend.';
    const diff = data[data.length - 1].y - data[0].y;
    const days = Math.max(1, (new Date(data[data.length-1].ts).getTime() - new Date(data[0].ts).getTime()) / 86400000);
    const rate = Math.abs(diff / days).toFixed(2);
    if (diff < -0.5) return `Losing ~${rate} kg/day — great progress! Aim for 0.5–1 kg/week for sustainable loss.`;
    if (diff > 0.5) return `Gaining ~${rate} kg/day. Try replacing refined carbs with dal, sabzi, or whole grains.`;
    return 'Weight stable. Consistency is key — keep logging daily.';
  }
  if (type === 'bp') {
    const avgSys = Math.round(data.reduce((a, b) => a + b.y, 0) / data.length);
    if (avgSys >= 140) return `Average systolic ${avgSys} mmHg — elevated. Reduce sodium to <2g/day, try DASH-friendly foods like amla and curd.`;
    if (avgSys >= 130) return `Average systolic ${avgSys} mmHg — borderline. Add 30 min of brisk walking daily.`;
    return `Average systolic ${avgSys} mmHg — well-controlled. Keep up the good work!`;
  }
  if (type === 'activity') {
    const total7 = data.slice(-7).reduce((a, b) => a + b.y, 0);
    if (total7 < 150) return `${total7} min this week — below the 150 min target. Try adding a 20-min morning walk.`;
    return `${total7} min this week — hitting your target! Yoga or strength training twice a week can boost metabolic health further.`;
  }
  if (type === 'calories') {
    const avg = Math.round(data.reduce((a, b) => a + b.y, 0) / data.length);
    if (avg > 2200) return `Averaging ${avg} kcal/day — consider replacing one refined-carb meal with a high-fibre option like jowar roti or moong dal.`;
    if (avg < 1200) return `Averaging ${avg} kcal/day — quite low. Ensure you're getting enough protein and nutrients.`;
    return `Averaging ${avg} kcal/day — reasonable. Focus on food quality: more fibre, less processed sugar.`;
  }
  return null;
}

interface ChartPoint { ts: string; label: string; y: number; y2?: number }

function useChartData(type: DetailType): { points: ChartPoint[]; logs: any[] } {
  const { weightLogs, bpLogs, foodLogs, exerciseLogs } = useData();
  const { user } = useAuth();

  return useMemo(() => {
    if (type === 'weight') {
      const sorted = [...weightLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const points = sorted.map(l => ({ ts: l.timestamp, label: fmt(l.timestamp), y: l.weight }));
      return { points, logs: sorted };
    }
    if (type === 'bp') {
      const sorted = [...bpLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const points = sorted.map(l => ({ ts: l.timestamp, label: fmt(l.timestamp), y: l.systolic, y2: l.diastolic }));
      return { points, logs: sorted };
    }
    if (type === 'activity') {
      // Aggregate by day
      const byDay: Record<string, number> = {};
      for (const l of exerciseLogs) {
        const d = new Date(l.timestamp).toDateString();
        byDay[d] = (byDay[d] || 0) + l.durationMinutes;
      }
      const sorted = Object.entries(byDay)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([d, mins]) => ({ ts: new Date(d).toISOString(), label: fmt(new Date(d).toISOString()), y: mins }));
      const logs = [...exerciseLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return { points: sorted, logs };
    }
    // calories — aggregate by day
    const byDay: Record<string, number> = {};
    for (const l of foodLogs) {
      const d = new Date(l.timestamp).toDateString();
      byDay[d] = (byDay[d] || 0) + l.calories;
    }
    const sorted = Object.entries(byDay)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([d, cal]) => ({ ts: new Date(d).toISOString(), label: fmt(new Date(d).toISOString()), y: cal }));
    const logs = [...foodLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return { points: sorted, logs };
  }, [type, weightLogs, bpLogs, foodLogs, exerciseLogs]);
}

function LogRow({ type, log }: { type: DetailType; log: any }) {
  if (type === 'weight') return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div>
        <p className="text-sm font-semibold text-ink">{log.weight} kg</p>
        <p className="text-[11px] text-ink-soft">{fmt(log.timestamp)} · {fmtTime(log.timestamp)}</p>
      </div>
    </div>
  );
  if (type === 'bp') return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div>
        <p className="text-sm font-semibold text-ink">{log.systolic}/{log.diastolic} <span className="text-ink-soft font-normal">mmHg</span></p>
        <p className="text-[11px] text-ink-soft">{fmt(log.timestamp)} · {fmtTime(log.timestamp)}</p>
      </div>
      <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full',
        log.systolic >= 140 ? 'bg-bad-50 text-bad-700' :
        log.systolic >= 130 ? 'bg-warn-50 text-warn-700' : 'bg-good-50 text-good-700'
      )}>
        {log.systolic >= 140 ? 'High' : log.systolic >= 130 ? 'Elevated' : 'Normal'}
      </span>
    </div>
  );
  if (type === 'activity') return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div>
        <p className="text-sm font-semibold text-ink capitalize">{log.type}</p>
        <p className="text-[11px] text-ink-soft">{fmt(log.timestamp)} · {fmtTime(log.timestamp)}</p>
      </div>
      <span className="text-sm font-bold text-ink">{log.durationMinutes} min</span>
    </div>
  );
  // calories
  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div>
        <p className="text-sm font-semibold text-ink">{log.name}</p>
        <p className="text-[11px] text-ink-soft">{fmt(log.timestamp)} · {log.portion || ''}</p>
      </div>
      <span className="text-sm font-bold text-ink">{log.calories} kcal</span>
    </div>
  );
}

interface Props {
  type: DetailType;
  onClose: () => void;
}

export function LogDetailSheet({ type, onClose }: Props) {
  const { points, logs } = useChartData(type);
  const meta = META[type];
  const Icon = meta.icon;
  const hint = tip(type, points);
  const isBP = type === 'bp';

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = last && prev ? last.y - prev.y : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-bg flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: meta.color + '18' }}>
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div>
            <p className="font-bold text-ink">{meta.label}</p>
            {last && (
              <p className="text-[11px] text-ink-muted flex items-center gap-1">
                Latest: <span className="font-semibold">{last.y}{isBP && last.y2 ? `/${last.y2}` : ''} {meta.unit}</span>
                {delta !== 0 && (
                  <span className={cn('inline-flex items-center gap-0.5 font-bold', delta < 0 ? 'text-good-600' : 'text-bad-600')}>
                    {delta < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    {Math.abs(delta).toFixed(1)}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Chart */}
        <div className="px-4 pt-5 pb-2">
          {points.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              {isBP ? (
                <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="y" name="Systolic" stroke={meta.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="y2" name="Diastolic" stroke="#94a3b8" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={meta.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="y" name={meta.unit} stroke={meta.color} strokeWidth={2} fill={`url(#grad-${type})`} dot={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-ink-soft gap-2">
              <Minus size={28} className="opacity-30" />
              <p className="text-sm">Not enough data for a chart yet</p>
              <p className="text-xs">Log at least 2 entries to see your trend</p>
            </div>
          )}
        </div>

        {/* AI Tip */}
        {hint && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-brand-50 border border-brand-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 mb-1">Coach tip</p>
            <p className="text-sm text-brand-900 leading-snug">{hint}</p>
          </div>
        )}

        {/* Log history */}
        <div className="px-5 pb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-3">All entries ({logs.length})</p>
          {logs.length === 0 ? (
            <p className="text-sm text-ink-muted py-6 text-center">No entries yet. Chat with the AI coach to log data.</p>
          ) : (
            <div>
              {logs.map((l, i) => <LogRow key={l.id || i} type={type} log={l} />)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
