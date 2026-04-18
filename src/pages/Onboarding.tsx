import { motion } from 'motion/react';
import { Heart, Droplets, Activity, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Props {
  onSignUp: () => void;
  onSignIn: () => void;
  onDemo?: () => void;
}

export function Onboarding({ onSignUp, onSignIn, onDemo }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row h-full min-h-screen bg-surface"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 md:py-20 gap-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="relative"
        >
          <div className="w-44 h-44 md:w-52 md:h-52 rounded-[48px] bg-gradient-to-br from-brand-100 to-brand-200/50 flex items-center justify-center relative">
            <div className="absolute -top-3 -left-3 p-3.5 bg-surface rounded-2xl shadow-md text-bad-500 rotate-[-8deg]"><Heart size={24} fill="currentColor" /></div>
            <div className="absolute -bottom-2 -right-2 p-3.5 bg-surface rounded-2xl shadow-md text-info-500 rotate-[8deg]"><Droplets size={24} fill="currentColor" /></div>
            <div className="p-5 bg-surface rounded-3xl shadow-lg text-brand-600"><Activity size={48} /></div>
          </div>
        </motion.div>

        <div className="space-y-3 max-w-md">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
            <Sparkles size={12} /> AI-powered prevention
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink">MetaboPrevent</h1>
          <p className="text-ink-muted text-base md:text-lg leading-relaxed">
            Your cardiometabolic coach for diabetes, hypertension, and heart health. Chat, log, learn.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {[
            { icon: Heart, label: 'Track risk' },
            { icon: Sparkles, label: 'AI logging' },
            { icon: ShieldCheck, label: 'Evidence-based' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-muted">
              <Icon size={18} className="text-brand-600" />
              <span className="text-[11px] font-semibold text-ink-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-2.5">
          <Button variant="primary" size="lg" fullWidth onClick={onSignUp}>Get Started</Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onSignIn}>Sign In</Button>
          {onDemo && <Button variant="secondary" size="lg" fullWidth onClick={onDemo} className="text-xs opacity-75">Try Demo</Button>}
        </div>
      </div>

      <div className="hidden md:flex flex-1 bg-gradient-to-br from-brand-50 to-accent-50/40 items-center justify-center p-12">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-surface rounded-[28px] p-6 shadow-[var(--shadow-pop)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Your risk</p>
                <p className="text-2xl font-bold text-ink mt-0.5">Improving</p>
              </div>
              <span className="inline-flex items-center gap-1 bg-good-50 text-good-700 text-xs font-bold px-2.5 py-1 rounded-full">↓ -17%</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Diabetes', val: 45, tone: 'bg-warn-500' },
                { label: 'Hypertension', val: 28, tone: 'bg-warn-500' },
                { label: 'Cardiovascular', val: 18, tone: 'bg-good-500' },
              ].map(({ label, val, tone }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted font-medium">{label}</span>
                    <span className="font-bold">{val}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className={`h-full ${tone} rounded-full`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-brand-700 text-white rounded-[24px] p-5 shadow-lg">
            <p className="text-sm font-semibold opacity-90">Today's nudge</p>
            <p className="text-base mt-1 leading-snug">Your sodium trended high yesterday—try curd rice with cucumber for dinner.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
