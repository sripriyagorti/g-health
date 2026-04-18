import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Activity, Stethoscope, Utensils, MessageSquare, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { IconBadge } from '../components/ui/IconBadge';
import { Button } from '../components/ui/Button';
import { RiskCard } from '../components/RiskCard';
import { PageHeader } from '../components/PageHeader';
import { LogDetailSheet } from '../components/LogDetailSheet';
import type { DetailType } from '../components/LogDetailSheet';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { calculateRiskScores, calculateDerivedMetrics } from '../utils/riskCalculations';

interface Props {
  onOpenChat: () => void;
  onOpenProfile: () => void;
}

export function Dashboard({ onOpenChat, onOpenProfile }: Props) {
  const { user } = useAuth();
  const { weightLogs, bpLogs, foodLogs, exerciseLogs } = useData();
  const [detail, setDetail] = useState<DetailType | null>(null);

  const derived = useMemo(
    () => calculateDerivedMetrics({ weights: weightLogs, bps: bpLogs, foods: foodLogs, exercises: exerciseLogs }),
    [weightLogs, bpLogs, foodLogs, exerciseLogs]
  );

  const risks = useMemo(() => calculateRiskScores(user || {}, derived), [user, derived]);

  const todayCalories = useMemo(() => {
    const today = new Date().toDateString();
    return foodLogs.filter(f => new Date(f.timestamp).toDateString() === today).reduce((a, b) => a + b.calories, 0);
  }, [foodLogs]);

  const lastWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : user?.weight ?? 0;
  const lastBp = bpLogs.length ? bpLogs[bpLogs.length - 1] : { systolic: user?.systolicBP ?? 0, diastolic: user?.diastolicBP ?? 0 };

  const firstName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
        <PageHeader
          title={`Hi, ${firstName}`}
          subtitle="Let's keep your prevention score moving."
          right={
            <button onClick={onOpenProfile} className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
              {firstName[0]?.toUpperCase()}
            </button>
          }
        />

        <div className="px-5 md:px-8 py-6 space-y-5 pb-6">
          <Card className="bg-gradient-to-br from-brand-700 to-brand-800 text-white border-none shadow-[var(--shadow-pop)]" padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-semibold opacity-75">AI coach</p>
                <h3 className="text-lg font-bold mt-1 leading-snug">Log meals & vitals by chatting.</h3>
                <p className="text-sm mt-2 opacity-85">Describe what you ate or upload a photo — I'll extract calories and sodium.</p>
              </div>
              <Sparkles size={20} className="opacity-80" />
            </div>
            <Button variant="accent" size="md" className="mt-4" onClick={onOpenChat} rightIcon={<MessageSquare size={14} />}>Start chatting</Button>
          </Card>

          <RiskCard
            diabetes={parseFloat(risks.diabetes)}
            hypertension={parseFloat(risks.hypertension)}
            cvd={parseFloat(risks.cvd)}
          />

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Scale} tone="brand" label="Weight"
              value={`${lastWeight.toFixed(1)} kg`}
              trend={derived.weightSlope}
              onClick={() => setDetail('weight')}
            />
            <StatCard
              icon={Stethoscope} tone="info" label="BP"
              value={`${lastBp.systolic}/${lastBp.diastolic}`}
              trendLabel={`Avg ${Math.round(derived.avgSBP) || lastBp.systolic}/${Math.round(derived.avgDBP) || lastBp.diastolic}`}
              onClick={() => setDetail('bp')}
            />
            <StatCard
              icon={Activity} tone="good" label="Activity"
              value={`${derived.act7} min`}
              trendLabel="Last 7 days"
              onClick={() => setDetail('activity')}
            />
            <StatCard
              icon={Utensils} tone="accent" label="Calories today"
              value={`${todayCalories}`}
              trendLabel={`${Math.round(derived.avgCal)} / day avg`}
              onClick={() => setDetail('calories')}
            />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {detail && <LogDetailSheet type={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </>
  );
}

function StatCard({
  icon: Icon, tone, label, value, trend, trendLabel, onClick,
}: { icon: any; tone: any; label: string; value: string; trend?: number; trendLabel?: string; onClick?: () => void }) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  return (
    <button onClick={onClick} className="text-left w-full">
      <Card className="transition-all active:scale-[0.97] hover:shadow-md cursor-pointer">
        <div className="flex items-start justify-between">
          <IconBadge tone={tone} size="sm"><Icon size={16} /></IconBadge>
          {trend !== undefined && (
            <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${trendDown ? 'text-good-700' : trendUp ? 'text-bad-700' : 'text-ink-soft'}`}>
              {trendDown ? <TrendingDown size={12} /> : trendUp ? <TrendingUp size={12} /> : null}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
          <p className="text-xl font-bold text-ink mt-0.5">{value}</p>
          {trendLabel && <p className="text-[11px] text-ink-soft mt-0.5">{trendLabel}</p>}
        </div>
      </Card>
    </button>
  );
}
