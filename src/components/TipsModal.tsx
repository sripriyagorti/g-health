import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { Button } from './ui/Button';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  risks: { diabetes: string; hypertension: string; cvd: string };
}

interface Tip {
  insight: string;
  action: string;
}

export function TipsModal({ isOpen, onClose, userData, risks }: TipsModalProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tips.length === 0) {
      fetchTips();
    }
  }, [isOpen]);

  async function fetchTips() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.profileSummary({
        ...userData,
        riskScores: risks,
        context: 'dashboard-tips'
      });
      setTips(response.bullets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate tips');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-3xl bg-surface shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-ink">AI Tips</h2>
                  <p className="text-xs text-ink-soft mt-0.5">Based on your scores</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-ink-soft"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={24} className="text-brand-600 animate-spin" />
                  <p className="text-sm text-ink-muted">Generating personalized tips...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-start gap-2 p-3 rounded-xl bg-bad-50 border border-bad-200">
                  <div className="flex items-center gap-2 text-bad-700">
                    <AlertCircle size={16} />
                    <p className="text-sm font-medium">Error generating tips</p>
                  </div>
                  <p className="text-xs text-bad-600">{error}</p>
                  <button
                    onClick={fetchTips}
                    className="text-xs font-semibold text-bad-700 hover:underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              ) : tips.length > 0 ? (
                <div className="space-y-4">
                  {tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="space-y-2 p-4 rounded-2xl bg-brand-50 border border-brand-100"
                    >
                      <p className="text-sm font-semibold text-brand-900">{tip.insight}</p>
                      <p className="text-xs text-brand-700 flex items-start gap-2">
                        <span className="mt-1 shrink-0">→</span>
                        <span>{tip.action}</span>
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted py-4">No tips available at this time.</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-line p-4">
              <Button variant="secondary" size="md" fullWidth onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
