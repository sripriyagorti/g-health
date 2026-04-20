import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

const PHASES = [
  'thinking',
  'calculating',
  'analyzing',
  'processing',
  'understanding',
];

interface ThinkingLoaderProps {
  phase?: 'image' | 'chat';
}

export function ThinkingLoader({ phase }: ThinkingLoaderProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const displayPhase = phase === 'image' ? 'processing image' : PHASES[phaseIndex];

  return (
    <div className="flex items-center gap-3 py-4">
      <Loader2 size={16} className="text-brand-600 animate-spin shrink-0" />
      <motion.p
        key={displayPhase}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.6 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-ink-muted"
      >
        {displayPhase}
      </motion.p>
    </div>
  );
}
