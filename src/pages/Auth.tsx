import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Heart } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Props {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onAuthed: (isNewUser: boolean) => void;
}

export function Auth({ mode, onBack, onAuthed }: Props) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const fn = isSignup ? api.signup : api.login;
      const { user } = await fn({ email, password });
      setUser(user);
      onAuthed(isSignup || !user.age);
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col bg-bg"
    >
      <div className="p-5 md:p-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-ink-muted hover:text-ink">
          <ArrowLeft size={18} /> Back
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Heart size={22} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-ink">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
            <p className="text-sm text-ink-muted">{isSignup ? "Start your prevention journey today." : "Sign in to continue."}</p>
          </div>

          {error && <div className="text-center text-sm text-bad-700 bg-bad-50 px-4 py-2.5 rounded-xl">{error}</div>}

          <div className="space-y-4 bg-surface p-6 rounded-[var(--radius-card)] border border-line shadow-[var(--shadow-card)]">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isSignup ? 'new-password' : 'current-password'} />

            <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit}>
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-ink-muted pt-2">
              {isSignup ? 'Have an account? ' : "Don't have an account? "}
              <button onClick={() => setIsSignup(v => !v)} className="text-brand-700 font-bold hover:underline">
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
