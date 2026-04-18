import { Home, MessageSquare, Droplets, Pill, User, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

export type NavScreen = 'dashboard' | 'chat' | 'biomarkers' | 'medications' | 'profile';

const ITEMS: { id: NavScreen; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'biomarkers', label: 'Labs', icon: Droplets },
  { id: 'medications', label: 'Meds', icon: Pill },
  { id: 'profile', label: 'Profile', icon: User },
];

interface Props {
  current: NavScreen;
  onChange: (s: NavScreen) => void;
}

export function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="md:hidden shrink-0 bg-surface/95 backdrop-blur-md border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 px-2 py-2">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors',
                active ? 'text-brand-700' : 'text-ink-soft'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-full transition-all',
                active && 'bg-brand-50'
              )}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav({ current, onChange }: Props) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-surface border-r border-line flex-col p-6 gap-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-sm">
          <Heart size={18} fill="currentColor" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-ink leading-none">MetaboPrevent</h1>
          <p className="text-[11px] text-ink-soft mt-1">Cardiometabolic coach</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-medium text-sm transition-colors',
                active ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="text-[11px] text-ink-soft px-2">
        Evidence-based prevention · Consult your clinician
      </div>
    </aside>
  );
}
