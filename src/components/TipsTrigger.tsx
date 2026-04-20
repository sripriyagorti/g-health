import { Sparkles, ArrowRight } from 'lucide-react';
import { Card } from './ui/Card';

interface TipsTriggerProps {
  onClick: () => void;
}

export function TipsTrigger({ onClick }: TipsTriggerProps) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="bg-gradient-to-br from-brand-50 to-accent-50/30 border-brand-100 hover:shadow-md transition-all cursor-pointer hover:border-brand-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-ink">Get AI tips</p>
              <p className="text-xs text-ink-soft mt-0.5">Based on your scores</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-brand-600 shrink-0" />
        </div>
      </Card>
    </button>
  );
}
