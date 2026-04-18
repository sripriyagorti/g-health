import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppLayout } from './components/AppLayout';
import type { NavScreen } from './components/Navigation';
import { Onboarding } from './pages/Onboarding';
import { Auth } from './pages/Auth';
import { Assessment } from './pages/Assessment';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Biomarkers } from './pages/Biomarkers';
import { Medications } from './pages/Medications';
import { Profile } from './pages/Profile';
import { api } from './api';

type AppScreen = 'onboarding' | 'auth' | 'assessment' | 'app';

function AppShell() {
  const { user, loading } = useAuth();
  const [appScreen, setAppScreen] = useState<AppScreen>('onboarding');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [navScreen, setNavScreen] = useState<NavScreen>('dashboard');

  // One-time sync: auto-advance once auth loads
  const [synced, setSynced] = useState(false);
  if (!loading && !synced) {
    setSynced(true);
    if (user) setAppScreen(user.age ? 'app' : 'assessment');
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleDemo = async () => {
    try {
      const result = await api.login({ email: 'test@test.com', password: 'super-secret' });
      localStorage.setItem('gh_user_id', result.user.id);
      window.location.reload();
    } catch (e) {
      alert('Demo account not ready. Please try again in a moment.');
    }
  };

  if (appScreen === 'onboarding') {
    return (
      <Onboarding
        onSignUp={() => { setAuthMode('signup'); setAppScreen('auth'); }}
        onSignIn={() => { setAuthMode('signin'); setAppScreen('auth'); }}
        onDemo={handleDemo}
      />
    );
  }

  if (appScreen === 'auth') {
    return (
      <Auth
        mode={authMode}
        onBack={() => setAppScreen('onboarding')}
        onAuthed={(isNewUser) => setAppScreen(isNewUser ? 'assessment' : 'app')}
      />
    );
  }

  if (appScreen === 'assessment') {
    return <Assessment isFirstTime={!user?.age} onDone={() => setAppScreen('app')} />;
  }

  // Main app — Chat needs scrollable=false (manages own scroll)
  const isChat = navScreen === 'chat';

  return (
    <DataProvider>
      <AppLayout current={navScreen} onNav={setNavScreen} scrollable={!isChat}>
        <AnimatePresence mode="wait">
          <motion.div
            key={navScreen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {navScreen === 'dashboard' && (
              <Dashboard
                onOpenChat={() => setNavScreen('chat')}
                onOpenProfile={() => setNavScreen('profile')}
              />
            )}
            {navScreen === 'chat' && <Chat />}
            {navScreen === 'biomarkers' && <Biomarkers />}
            {navScreen === 'medications' && <Medications />}
            {navScreen === 'profile' && (
              <Profile onSignOut={() => { setSynced(false); setAppScreen('onboarding'); }} onTriggerOnboarding={() => setAppScreen('assessment')} />
            )}
          </motion.div>
        </AnimatePresence>
      </AppLayout>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
