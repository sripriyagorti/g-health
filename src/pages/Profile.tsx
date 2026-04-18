import { useState } from 'react';
import { motion } from 'motion/react';
import { Edit2, Check, X, LogOut, RefreshCw, PlayCircle } from 'lucide-react';
import { api } from '../api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

// Geometric avatar — deterministic colors from user id/email
function GeometricAvatar({ seed, size = 80 }: { seed: string; size?: number }) {
  const colors = [
    ['#6366f1', '#8b5cf6'], // indigo→violet
    ['#0ea5e9', '#06b6d4'], // sky→cyan
    ['#10b981', '#34d399'], // emerald→green
    ['#f59e0b', '#f97316'], // amber→orange
    ['#ec4899', '#f43f5e'], // pink→rose
    ['#8b5cf6', '#6366f1'], // violet→indigo
    ['#14b8a6', '#0ea5e9'], // teal→sky
  ];
  const shapes = [
    // triangle
    (c: string) => <polygon points="50,10 90,80 10,80" fill={c} />,
    // diamond
    (c: string) => <polygon points="50,10 85,50 50,90 15,50" fill={c} />,
    // hexagon
    (c: string) => <polygon points="50,10 83,30 83,70 50,90 17,70 17,30" fill={c} />,
    // star-ish
    (c: string) => <polygon points="50,10 61,35 90,35 67,57 76,85 50,68 24,85 33,57 10,35 39,35" fill={c} />,
  ];
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [from, to] = colors[h % colors.length];
  const shape = shapes[(h >> 2) % shapes.length];
  const id = `grad-${seed.slice(0, 6)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-2xl">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} rx="0" />
      {shape('rgba(255,255,255,0.30)')}
    </svg>
  );
}

interface EditableRowProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  type?: 'text' | 'number';
  onSave: (v: string) => Promise<void>;
}

function EditableRow({ label, value, unit, type = 'text', onSave }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);

  async function commit() {
    setSaving(true);
    try { await onSave(draft); setEditing(false); }
    finally { setSaving(false); }
  }

  function cancel() { setDraft(String(value ?? '')); setEditing(false); }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <span className="text-sm text-ink-muted w-32 shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            className="flex-1 text-sm bg-surface-muted rounded-xl px-3 py-1.5 border border-brand-400 outline-none text-ink"
          />
          {unit && <span className="text-xs text-ink-soft">{unit}</span>}
          <button onClick={commit} disabled={saving} className="p-1.5 rounded-lg text-good-600 hover:bg-good-50"><Check size={14} /></button>
          <button onClick={cancel} className="p-1.5 rounded-lg text-ink-soft hover:bg-surface-muted"><X size={14} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold text-ink">{value ?? '—'}{unit ? ` ${unit}` : ''}</span>
          <button onClick={() => { setDraft(String(value ?? '')); setEditing(true); }} className="p-1.5 rounded-lg text-ink-soft hover:text-brand-700 hover:bg-brand-50">
            <Edit2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

interface SelectRowProps {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onSave: (v: string) => Promise<void>;
}

function SelectRow({ label, value, options, onSave }: SelectRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  async function commit(v: string) {
    setSaving(true);
    try { await onSave(v); setEditing(false); }
    finally { setSaving(false); }
  }

  const display = options.find(o => o.value === value)?.label ?? value ?? '—';

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <span className="text-sm text-ink-muted w-32 shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <select
            autoFocus
            value={draft}
            onChange={e => { setDraft(e.target.value); commit(e.target.value); }}
            onBlur={() => setEditing(false)}
            className="text-sm bg-surface-muted rounded-xl px-3 py-1.5 border border-brand-400 outline-none text-ink"
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold text-ink capitalize">{display}</span>
          <button onClick={() => { setDraft(value ?? ''); setEditing(true); }} className="p-1.5 rounded-lg text-ink-soft hover:text-brand-700 hover:bg-brand-50">
            <Edit2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function CheckRow({ label, value, onSave }: { label: string; value: boolean | undefined; onSave: (v: boolean) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  async function toggle() {
    setSaving(true);
    try { await onSave(!value); }
    finally { setSaving(false); }
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <button
        onClick={toggle}
        disabled={saving}
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative',
          value ? 'bg-brand-600' : 'bg-line'
        )}
      >
        <span className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
          value ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
    </div>
  );
}

interface Props {
  onSignOut?: () => void;
  onTriggerOnboarding?: () => void;
}

export function Profile({ onSignOut, onTriggerOnboarding }: Props) {
  const { user, updateUser, signOut } = useAuth();
  const [resetting, setResetting] = useState(false);

  const name = user?.name || user?.email?.split('@')[0] || 'User';
  const seed = user?.id || user?.email || 'default';

  async function save(key: string, raw: string | boolean) {
    const value = typeof raw === 'boolean' ? raw : isNaN(Number(raw)) ? raw : Number(raw);
    await updateUser({ [key]: value });
  }

  function handleSignOut() {
    signOut();
    onSignOut?.();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
      <PageHeader title="Profile" subtitle="Manage your health data and settings" />

      <div className="px-5 md:px-8 py-6 space-y-5 pb-6">
        {/* Avatar + name */}
        <Card className="flex items-center gap-4">
          <GeometricAvatar seed={seed} size={72} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-ink truncate">{name}</p>
            <p className="text-sm text-ink-muted truncate">{user?.email}</p>
            <p className="text-xs text-ink-soft mt-0.5">Member since {user?._id ? new Date(parseInt(user.id.slice(0,8), 16) * 1000).getFullYear() : new Date().getFullYear()}</p>
          </div>
        </Card>

        {/* Basic info */}
        <Card className="space-y-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft pb-2">Personal</p>
          <EditableRow label="Name" value={user?.name || name} onSave={v => save('name', v)} />
          <EditableRow label="Age" value={user?.age} unit="yrs" type="number" onSave={v => save('age', v)} />
          <SelectRow
            label="Gender"
            value={user?.gender}
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
            onSave={v => save('gender', v)}
          />
        </Card>

        {/* Body metrics */}
        <Card className="space-y-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft pb-2">Body metrics</p>
          <EditableRow label="Height" value={user?.height} unit="cm" type="number" onSave={v => save('height', v)} />
          <EditableRow label="Weight" value={user?.weight} unit="kg" type="number" onSave={v => save('weight', v)} />
          <EditableRow label="Waist" value={user?.waist} unit="cm" type="number" onSave={v => save('waist', v)} />
        </Card>

        {/* Vitals */}
        <Card className="space-y-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft pb-2">Baseline vitals</p>
          <EditableRow label="Systolic BP" value={user?.systolicBP} unit="mmHg" type="number" onSave={v => save('systolicBP', v)} />
          <EditableRow label="Diastolic BP" value={user?.diastolicBP} unit="mmHg" type="number" onSave={v => save('diastolicBP', v)} />
          <EditableRow label="Fasting glucose" value={user?.fastingGlucose} unit="mg/dL" type="number" onSave={v => save('fastingGlucose', v)} />
          <EditableRow label="HDL" value={user?.hdl} unit="mg/dL" type="number" onSave={v => save('hdl', v)} />
          <EditableRow label="LDL" value={user?.ldl} unit="mg/dL" type="number" onSave={v => save('ldl', v)} />
          <EditableRow label="Triglycerides" value={user?.triglycerides} unit="mg/dL" type="number" onSave={v => save('triglycerides', v)} />
        </Card>

        {/* Lifestyle */}
        <Card className="space-y-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft pb-2">Lifestyle</p>
          <SelectRow
            label="Activity level"
            value={user?.activityLevel}
            options={[
              { value: 'sedentary', label: 'Sedentary' },
              { value: 'light', label: 'Light' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'active', label: 'Active' },
            ]}
            onSave={v => save('activityLevel', v)}
          />
          <CheckRow label="Family history of CVD/diabetes" value={user?.familyHistory} onSave={v => save('familyHistory', v)} />
        </Card>

        {/* Demo controls */}
        {user?.email === 'test@test.com' && (
          <Card className="space-y-1 border-2 border-warn-200 bg-warn-50/40">
            <p className="text-[11px] font-bold uppercase tracking-wider text-warn-700 pb-1">Demo controls</p>
            <button
              onClick={async () => {
                setResetting(true);
                try { await api.demoReset(); window.location.reload(); }
                finally { setResetting(false); }
              }}
              disabled={resetting}
              className="w-full flex items-center gap-3 px-2 py-2.5 text-warn-700 hover:bg-warn-100 rounded-xl transition-colors"
            >
              <RefreshCw size={16} className={resetting ? 'animate-spin' : ''} />
              <span className="text-sm font-semibold">Reset demo data</span>
            </button>
            <button
              onClick={() => onTriggerOnboarding?.()}
              className="w-full flex items-center gap-3 px-2 py-2.5 text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
            >
              <PlayCircle size={16} />
              <span className="text-sm font-semibold">Try onboarding flow</span>
            </button>
          </Card>
        )}

        {/* Sign out */}
        <Card padding="sm">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-2 py-2 text-bad-600 hover:bg-bad-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-semibold">Sign out</span>
          </button>
        </Card>

        <p className="text-center text-[11px] text-ink-soft">
          MetaboPrevent · Evidence-based cardiometabolic prevention
        </p>
      </div>
    </motion.div>
  );
}
