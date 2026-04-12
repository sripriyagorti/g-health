import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Heart, 
  Activity, 
  Scale, 
  Utensils, 
  ChevronRight, 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  Home, 
  User,
  Settings,
  Info,
  Droplets,
  Stethoscope,
  Calendar,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Camera,
  Check,
  X,
  Database
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card } from './components/ui/Card';
import { RiskMeter } from './components/RiskMeter';
import { ProgressRing } from './components/ProgressRing';
import { cn } from './lib/utils';
import { UserData, RiskResults, DailyLog, ChatMessage, WeightLog, BPLog, FoodLog, ExerciseLog } from './types';
import { calculateRiskScores, calculateDerivedMetrics } from './utils/riskCalculations';
import { mockWeightLogs, mockBPLogs, mockFoodLogs, mockExerciseLogs } from './mockData';

// Mock Data
const MOCK_TRENDS = [
  { day: 'Mon', weight: 82.5, bp: 135, activity: 30, risk: 65 },
  { day: 'Tue', weight: 82.2, bp: 132, activity: 45, risk: 62 },
  { day: 'Wed', weight: 82.3, bp: 130, activity: 20, risk: 63 },
  { day: 'Thu', weight: 81.9, bp: 128, activity: 60, risk: 58 },
  { day: 'Fri', weight: 81.7, bp: 126, activity: 50, risk: 55 },
  { day: 'Sat', weight: 81.5, bp: 125, activity: 90, risk: 50 },
  { day: 'Sun', weight: 81.4, bp: 124, activity: 40, risk: 48 },
];

type Screen = 'onboarding' | 'auth' | 'assessment' | 'dashboard' | 'logging' | 'analytics' | 'ai_assistant';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [preventionPlan, setPreventionPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [userData, setUserData] = useState<Partial<UserData>>({
    age: 45,
    gender: 'male',
    height: 170,
    weight: 85,
    waist: 98,
    systolicBP: 140,
    diastolicBP: 90,
    fastingGlucose: 110,
    activityLevel: 'light',
    familyHistory: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(mockWeightLogs);
  const [bpLogs, setBpLogs] = useState<BPLog[]>(mockBPLogs);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>(mockFoodLogs);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(mockExerciseLogs);

  // Logging State
  const [logCalories, setLogCalories] = useState<number | ''>('');
  const [logRefinedCarbs, setLogRefinedCarbs] = useState(false);
  const [logExerciseMinutes, setLogExerciseMinutes] = useState<number | ''>('');
  const [logExerciseType, setLogExerciseType] = useState('Walking');
  const [logSystolic, setLogSystolic] = useState<number | ''>('');
  const [logDiastolic, setLogDiastolic] = useState<number | ''>('');
  const [logWeight, setLogWeight] = useState<number | ''>('');
  const [logWaist, setLogWaist] = useState<number | ''>('');
  const [logGlucose, setLogGlucose] = useState<number | ''>('');
  const [logTriglycerides, setLogTriglycerides] = useState<number | ''>('');
  const [logHdl, setLogHdl] = useState<number | ''>('');
  const [logLdl, setLogLdl] = useState<number | ''>('');

  const validateInput = (name: string, value: number | undefined) => {
    if (value === undefined || isNaN(value)) return;
    let error = '';
    switch (name) {
      case 'age':
        if (value < 18 || value > 120) error = 'Age must be between 18 and 120';
        break;
      case 'height':
        if (value < 50 || value > 300) error = 'Height must be between 50 and 300 cm';
        break;
      case 'weight':
        if (value < 20 || value > 500) error = 'Weight must be between 20 and 500 kg';
        break;
      case 'waist':
        if (value < 30 || value > 300) error = 'Waist must be between 30 and 300 cm';
        break;
      case 'systolicBP':
        if (value < 50 || value > 300) error = 'Systolic BP must be between 50 and 300';
        break;
      case 'diastolicBP':
        if (value < 30 || value > 200) error = 'Diastolic BP must be between 30 and 200';
        break;
      case 'fastingGlucose':
        if (value < 20 || value > 600) error = 'Glucose must be between 20 and 600';
        break;
      case 'triglycerides':
        if (value < 20 || value > 2000) error = 'Triglycerides must be between 20 and 2000';
        break;
      case 'hdl':
        if (value < 10 || value > 200) error = 'HDL must be between 10 and 200';
        break;
      case 'ldl':
        if (value < 10 || value > 400) error = 'LDL must be between 10 and 400';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleInputChange = (field: keyof UserData, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (typeof value === 'number') {
      validateInput(field, value);
    }
  };

  const derivedMetrics = useMemo(() => {
    return calculateDerivedMetrics({ weights: weightLogs, bps: bpLogs, foods: foodLogs, exercises: exerciseLogs });
  }, [weightLogs, bpLogs, foodLogs, exerciseLogs]);

  const bmi = useMemo(() => {
    if (userData.weight && userData.height) {
      return (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1);
    }
    return '0';
  }, [userData.weight, userData.height]);

  const risks = useMemo(() => {
    return calculateRiskScores(userData, derivedMetrics);
  }, [userData, derivedMetrics]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !chatImage) return;
    
    const userMsg = chatInput;
    const img = chatImage;
    
    const newMsg: ChatMessage = { role: 'user', text: userMsg };
    if (img) newMsg.image = img;
    
    const newHistory = [...chatMessages, newMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatImage(null);
    setIsTyping(true);

    try {
      const formattedHistory = newHistory.map(m => {
        const parts = [];
        if (m.text) parts.push({ text: m.text });
        if (m.image) {
          const mimeType = m.image.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
          const data = m.image.split(',')[1];
          parts.push({ inlineData: { data, mimeType } });
        }
        return { role: m.role === 'ai' ? 'model' : 'user', parts };
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          userId: currentUser?.id
        })
      });
      const data = await response.json();
      if (data.functionCall) {
        setChatMessages(prev => [...prev, { role: 'ai', functionCall: data.functionCall }]);
      } else if (data.text) {
        setChatMessages(prev => [...prev, { role: 'ai', text: data.text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const confirmFunctionCall = async (index: number) => {
    const msg = chatMessages[index];
    if (!msg.functionCall) return;

    // Mark as confirmed
    const updatedMessages = [...chatMessages];
    updatedMessages[index] = { ...msg, confirmed: true };
    
    // Add user confirmation response
    const confirmationMsg: ChatMessage = { 
      role: 'user', 
      functionResponse: { name: msg.functionCall.name, response: { status: 'success', message: 'Data logged successfully.' } } 
    };
    
    const newHistory = [...updatedMessages, confirmationMsg];
    setChatMessages(newHistory);
    setIsTyping(true);

    try {
      const formattedHistory = newHistory.map(m => {
        const parts = [];
        if (m.text) parts.push({ text: m.text });
        if (m.functionCall) parts.push({ functionCall: m.functionCall });
        if (m.functionResponse) parts.push({ functionResponse: m.functionResponse });
        
        let role = m.role === 'ai' ? 'model' : 'user';
        if (m.functionResponse) role = 'user';
        if (m.functionCall) role = 'model';
        return { role, parts };
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          userId: currentUser?.id
        })
      });
      const data = await response.json();
      if (data.text) {
        setChatMessages(prev => [...prev, { role: 'ai', text: data.text }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const cancelFunctionCall = (index: number) => {
    const updatedMessages = [...chatMessages];
    updatedMessages.splice(index, 1);
    setChatMessages(updatedMessages);
  };

  // Meal analysis integrated into chat - see handleSendMessage

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setCurrentScreen('ai_assistant');
    setChatMessages(prev => [...prev, { role: 'user', text: "Generate a personalized 7-day cardiometabolic prevention plan based on my profile." }]);
    setIsTyping(true);
    
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.plan || "I'm sorry, I couldn't generate the plan." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Failed to generate plan. Please try again." }]);
    } finally {
      setIsTyping(false);
      setIsGeneratingPlan(false);
    }
  };

  const generateDashboardTips = () => {
    const tips = [];
    
    // Activity streak suggestion
    if (derivedMetrics.act7 >= 150) {
      tips.push({ title: "Great Activity Streak!", message: "You've hit your 150 min/week goal. Keep it up to maintain cardiovascular health.", type: "success" });
    } else if (derivedMetrics.act7 > 0) {
      tips.push({ title: "Keep Moving", message: `You have ${derivedMetrics.act7} mins of activity this week. Try adding a 20-minute walk today to reach your 150 min goal.`, type: "warning" });
    } else {
      tips.push({ title: "Start Your Streak", message: "Even 10 minutes of light walking can jumpstart your metabolism today.", type: "info" });
    }

    // Weight trend
    if (derivedMetrics.weightSlope < 0) {
      tips.push({ title: "Weight Trend", message: `You've lost ${Math.abs(derivedMetrics.weightSlope).toFixed(1)}% weight in 30 days. Excellent progress!`, type: "success" });
    } else if (derivedMetrics.weightSlope > 0) {
      tips.push({ title: "Weight Trend", message: `Your weight is up ${derivedMetrics.weightSlope.toFixed(1)}% in 30 days. Let's review your recent meals.`, type: "warning" });
    }

    return tips;
  };

  const renderOnboarding = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col md:flex-row h-full bg-white"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8 md:p-12 lg:p-20">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-48 h-48 md:w-64 md:h-64 bg-slate-50 rounded-full flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-slate-100/50 rounded-full animate-pulse" />
          <div className="relative flex space-x-[-10px] md:space-x-[-15px]">
            <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 text-rose-500">
              <Heart size={32} className="md:w-12 md:h-12" fill="currentColor" />
            </div>
            <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 text-blue-500 mt-8 md:mt-12">
              <Droplets size={32} className="md:w-12 md:h-12" fill="currentColor" />
            </div>
            <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 text-emerald-500">
              <Activity size={32} className="md:w-12 md:h-12" />
            </div>
          </div>
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">G-Health</h1>
          <p className="text-slate-500 text-lg md:text-2xl font-medium">Prevent Today. Protect Tomorrow.</p>
        </div>

        <p className="text-slate-400 max-w-xs md:max-w-md leading-relaxed md:text-lg">
          Your personal health companion for tracking and preventing cardiometabolic risks.
        </p>

        <div className="space-y-3 w-full max-w-xs md:max-w-sm pt-4">
          <button
            onClick={() => { setIsLoginMode(false); setIsFirstTime(false); setCurrentScreen('auth'); }}
            className="w-full bg-black text-white py-4 rounded-2xl font-semibold shadow-md active:scale-[0.98] transition-transform"
          >
            Get Started
          </button>
          <button
            onClick={() => { setIsLoginMode(true); setCurrentScreen('auth'); }}
            className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-semibold active:scale-[0.98] transition-transform"
          >
            Sign In
          </button>
        </div>
      </div>
      
      <div className="hidden lg:flex flex-1 bg-slate-50 items-center justify-center p-12">
        <div className="relative w-full max-w-lg aspect-square bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50" />
          <div className="p-8 space-y-6 relative z-10">
            <div className="h-4 w-32 bg-slate-200 rounded-full" />
            <div className="h-8 w-48 bg-slate-300 rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-white border border-slate-100 shadow-sm rounded-3xl" />
              <div className="h-32 bg-white border border-slate-100 shadow-sm rounded-3xl" />
            </div>
            <div className="h-40 bg-white border border-slate-100 shadow-sm rounded-3xl" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const handleAuth = async () => {
    setAuthError('');
    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
      const body = isLoginMode
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        setCurrentUser(data.user);
        if (data.user.age) {
          setUserData(data.user);
          // Returning user with complete profile
          setCurrentScreen('dashboard');
        } else {
          // First-time signup: go to assessment
          setIsFirstTime(true);
          setCurrentScreen('assessment');
        }

        // Fetch logs if available
        const logsRes = await fetch(`/api/logs/${data.user.id}`);
        const logsData = await logsRes.json();
        if (logsData.logs) {
          // In a real app, we'd parse these back into weightLogs, bpLogs, etc.
        }
      }
    } catch (error) {
      setAuthError('Authentication failed');
    }
  };

  const renderAuth = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full bg-slate-50 items-center justify-center p-6"
    >
      <Card className="w-full max-w-md space-y-6 p-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center text-white mb-4">
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 text-sm">
            {isLoginMode ? 'Sign in to access your health data.' : 'Join G-Health to start tracking.'}
          </p>
        </div>

        {authError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{authError}</div>}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Email</label>
            <input 
              type="email" 
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Password</label>
            <input 
              type="password" 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
              placeholder="••••••••"
            />
          </div>
        </div>

        {!isLoginMode && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 text-center">Health profile will be completed after sign up</p>
          </div>
        )}

        <button 
          onClick={handleAuth}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold shadow-md active:scale-[0.98] transition-transform"
        >
          {isLoginMode ? 'Sign In' : 'Sign Up'}
        </button>

        <p className="text-center text-sm text-slate-500">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-black font-bold hover:underline"
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </Card>
    </motion.div>
  );

  const handleSaveProfile = async () => {
    // Save profile to backend if logged in, then go to dashboard
    if (currentUser?.id) {
      try {
        await fetch(`/api/user/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      } catch (e) {
        console.error("Failed to save profile", e);
      }
    }
    setIsFirstTime(false);
    setCurrentScreen('dashboard');
  };

  const renderAssessment = () => (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      className="flex flex-col h-full bg-slate-50"
    >
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center space-x-4 mb-4">
          {isFirstTime && (
            <button onClick={() => setCurrentScreen('auth')} className="p-2 -ml-2 text-slate-400 md:hidden">
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-xl font-bold">{isFirstTime ? 'Health Profile' : 'Update Profile'}</h2>
        </div>
        <p className="text-sm text-slate-500">{isFirstTime ? 'Complete your profile to get personalized risk indicators.' : 'Update your health information.'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="space-y-6">
            <Card className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Biometrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Age</label>
                  <input 
                    type="number" 
                    value={userData.age} 
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                    className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.age && "ring-2 ring-red-500")}
                  />
                  {errors.age && <p className="text-[10px] text-red-500">{errors.age}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Gender</label>
                  <select 
                    value={userData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Height (cm)</label>
                  <input 
                    type="number" 
                    value={userData.height} 
                    onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                    className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.height && "ring-2 ring-red-500")}
                  />
                  {errors.height && <p className="text-[10px] text-red-500">{errors.height}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={userData.weight} 
                    onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
                    className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.weight && "ring-2 ring-red-500")}
                  />
                  {errors.weight && <p className="text-[10px] text-red-500">{errors.weight}</p>}
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-slate-500">Activity Level</label>
                  <select 
                    value={userData.activityLevel}
                    onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light Activity</option>
                    <option value="moderate">Moderate Activity</option>
                    <option value="active">Very Active</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2 flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="familyHistory"
                    checked={userData.familyHistory}
                    onChange={(e) => handleInputChange('familyHistory', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="familyHistory" className="text-sm font-medium text-slate-700">Family history of diabetes or heart disease?</label>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-slate-50">
                <span className="text-sm font-medium text-slate-600">Calculated BMI</span>
                <span className="text-lg font-bold text-blue-600">{bmi}</span>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Clinical Data</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Waist Circumference (cm)</label>
                  <input 
                    type="number" 
                    value={userData.waist} 
                    onChange={(e) => handleInputChange('waist', parseInt(e.target.value))}
                    className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.waist && "ring-2 ring-red-500")}
                  />
                  {errors.waist && <p className="text-[10px] text-red-500">{errors.waist}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Systolic BP</label>
                    <input 
                      type="number" 
                      value={userData.systolicBP} 
                      onChange={(e) => handleInputChange('systolicBP', parseInt(e.target.value))}
                      className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.systolicBP && "ring-2 ring-red-500")}
                    />
                    {errors.systolicBP && <p className="text-[10px] text-red-500">{errors.systolicBP}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Diastolic BP</label>
                    <input 
                      type="number" 
                      value={userData.diastolicBP} 
                      onChange={(e) => handleInputChange('diastolicBP', parseInt(e.target.value))}
                      className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.diastolicBP && "ring-2 ring-red-500")}
                    />
                    {errors.diastolicBP && <p className="text-[10px] text-red-500">{errors.diastolicBP}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Fasting Glucose (mg/dL)</label>
                    <input 
                      type="number" 
                      value={userData.fastingGlucose || ''} 
                      onChange={(e) => handleInputChange('fastingGlucose', parseInt(e.target.value))}
                      className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.fastingGlucose && "ring-2 ring-red-500")}
                    />
                    {errors.fastingGlucose && <p className="text-[10px] text-red-500">{errors.fastingGlucose}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Triglycerides (mg/dL)</label>
                    <input 
                      type="number" 
                      value={userData.triglycerides || ''} 
                      onChange={(e) => handleInputChange('triglycerides', parseInt(e.target.value))}
                      className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.triglycerides && "ring-2 ring-red-500")}
                    />
                    {errors.triglycerides && <p className="text-[10px] text-red-500">{errors.triglycerides}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">HDL (mg/dL)</label>
                    <input 
                      type="number" 
                      value={userData.hdl || ''} 
                      onChange={(e) => handleInputChange('hdl', parseInt(e.target.value))}
                      className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.hdl && "ring-2 ring-red-500")}
                    />
                    {errors.hdl && <p className="text-[10px] text-red-500">{errors.hdl}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">LDL (mg/dL)</label>
                    <input 
                      type="number" 
                      value={userData.ldl || ''} 
                      onChange={(e) => handleInputChange('ldl', parseInt(e.target.value))}
                      className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500", errors.ldl && "ring-2 ring-red-500")}
                    />
                    {errors.ldl && <p className="text-[10px] text-red-500">{errors.ldl}</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Risk Results</h3>
              <div className="space-y-6">
                <RiskMeter label="Diabetes Risk" level={parseFloat(risks.diabetes) > 50 ? 'High' : parseFloat(risks.diabetes) > 20 ? 'Moderate' : 'Low'} score={`${risks.diabetes}%`} />
                <RiskMeter label="Hypertension Risk" level={parseFloat(risks.hypertension) > 50 ? 'High' : parseFloat(risks.hypertension) > 20 ? 'Moderate' : 'Low'} score={`${risks.hypertension}%`} />
                <RiskMeter label="Cardiovascular Indicator" level={parseFloat(risks.cvd) > 50 ? 'High' : parseFloat(risks.cvd) > 20 ? 'Moderate' : 'Low'} score={`${risks.cvd}%`} />
              </div>
            </Card>

            <button
              onClick={handleSaveProfile}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-200"
            >
              {isFirstTime ? 'Complete Signup' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-slate-50"
    >
      <div className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Summary</h2>
          </div>
          <button 
            onClick={() => setCurrentScreen('assessment')}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full flex items-center justify-center text-slate-600"
          >
            <User size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
            onClick={() => setCurrentScreen('logging')}
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3">
              <Scale size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Log Weight</span>
            <span className="text-xs text-slate-500 mt-1">Trend: {derivedMetrics.weightSlope < 0 ? '↓' : '↑'} {Math.abs(derivedMetrics.weightSlope).toFixed(1)}%</span>
          </Card>

          <Card
            className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
            onClick={() => setCurrentScreen('logging')}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
              <Activity size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Log Activity</span>
            <span className="text-xs text-slate-500 mt-1">This week: {derivedMetrics.act7} min</span>
          </Card>

          <Card
            className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
            onClick={() => setCurrentScreen('ai_assistant')}
          >
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-3">
              <Utensils size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Analyze Meal</span>
            <span className="text-xs text-slate-500 mt-1">Ask AI for calories</span>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Highlights</h3>
          {generateDashboardTips().map((tip, i) => (
            <div key={i}>
              <Card className={cn(
                "border border-slate-100 shadow-sm",
                tip.type === 'success' ? "bg-emerald-50/50" :
                tip.type === 'warning' ? "bg-amber-50/50" :
                "bg-blue-50/50"
              )}>
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    tip.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                    tip.type === 'warning' ? "bg-amber-100 text-amber-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{tip.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{tip.message}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="space-y-4 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Daily Targets</h3>
              <button onClick={() => setCurrentScreen('logging')} className="text-blue-600 text-sm font-medium hover:text-blue-700">
                Log Data
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <Utensils size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Calories</span>
                    <span className="text-sm text-slate-500">1,450 / 1,800 kcal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

        <Card className="bg-black text-white border-none flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Personalized Plan</h3>
                <p className="text-slate-400 text-sm">AI-powered prevention strategy.</p>
              </div>
              <Sparkles size={24} className="text-slate-300" />
            </div>
          </div>
          <button 
            onClick={handleGeneratePlan}
            disabled={isGeneratingPlan}
            className="mt-6 w-full bg-white text-black py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isGeneratingPlan ? "Generating..." : "Generate 7-Day Plan"}
          </button>
        </Card>
        </div>
      </div>
    </motion.div>
  );

  const handleSaveLog = async () => {
    const newErrors: Record<string, string> = {};
    
    if (logCalories !== '' && (logCalories < 0 || logCalories > 5000)) newErrors.logCalories = "Calories must be 0-5000";
    if (logExerciseMinutes !== '' && (logExerciseMinutes < 0 || logExerciseMinutes > 1440)) newErrors.logExerciseMinutes = "Minutes must be 0-1440";
    if (logSystolic !== '' && (logSystolic < 50 || logSystolic > 300)) newErrors.logSystolic = "Systolic must be 50-300";
    if (logDiastolic !== '' && (logDiastolic < 30 || logDiastolic > 200)) newErrors.logDiastolic = "Diastolic must be 30-200";
    if (logWeight !== '' && (logWeight < 20 || logWeight > 500)) newErrors.logWeight = "Weight must be 20-500";
    if (logWaist !== '' && (logWaist < 30 || logWaist > 300)) newErrors.logWaist = "Waist must be 30-300";
    if (logGlucose !== '' && (logGlucose < 20 || logGlucose > 600)) newErrors.logGlucose = "Glucose must be 20-600";
    if (logTriglycerides !== '' && (logTriglycerides < 20 || logTriglycerides > 2000)) newErrors.logTriglycerides = "Triglycerides must be 20-2000";
    if (logHdl !== '' && (logHdl < 10 || logHdl > 200)) newErrors.logHdl = "HDL must be 10-200";
    if (logLdl !== '' && (logLdl < 10 || logLdl > 400)) newErrors.logLdl = "LDL must be 10-400";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const timestamp = new Date().toISOString();

    const saveLogToBackend = async (type: string, data: any) => {
      if (!currentUser?.id) return;
      try {
        await fetch(`/api/logs/${currentUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data, timestamp })
        });
      } catch (e) {
        console.error("Failed to save log", e);
      }
    };

    if (logWeight !== '') {
      setWeightLogs(prev => [...prev, { id: Date.now().toString(), weight: Number(logWeight), timestamp }]);
      setUserData(prev => ({ ...prev, weight: Number(logWeight) }));
      await saveLogToBackend('weight', { weight: Number(logWeight) });
    }
    if (logSystolic !== '' && logDiastolic !== '') {
      setBpLogs(prev => [...prev, { id: Date.now().toString(), systolic: Number(logSystolic), diastolic: Number(logDiastolic), timestamp }]);
      setUserData(prev => ({ ...prev, systolicBP: Number(logSystolic), diastolicBP: Number(logDiastolic) }));
      await saveLogToBackend('bp', { systolic: Number(logSystolic), diastolic: Number(logDiastolic) });
    }
    if (logCalories !== '') {
      setFoodLogs(prev => [...prev, { id: Date.now().toString(), name: mealDescription || 'Manual Entry', calories: Number(logCalories), timestamp }]);
      await saveLogToBackend('food', { name: mealDescription || 'Manual Entry', calories: Number(logCalories) });
    }
    if (logExerciseMinutes !== '') {
      setExerciseLogs(prev => [...prev, { id: Date.now().toString(), type: logExerciseType, durationMinutes: Number(logExerciseMinutes), timestamp }]);
      await saveLogToBackend('exercise', { type: logExerciseType, durationMinutes: Number(logExerciseMinutes) });
    }
    
    // Update other user data if logged
    const updates: Partial<UserData> = {};
    if (logWaist !== '') updates.waist = Number(logWaist);
    if (logGlucose !== '') updates.fastingGlucose = Number(logGlucose);
    if (logTriglycerides !== '') updates.triglycerides = Number(logTriglycerides);
    if (logHdl !== '') updates.hdl = Number(logHdl);
    if (logLdl !== '') updates.ldl = Number(logLdl);
    
    if (Object.keys(updates).length > 0) {
      setUserData(prev => ({ ...prev, ...updates }));
      if (currentUser?.id) {
        fetch(`/api/user/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }).catch(console.error);
      }
    }

    // Reset form
    setLogCalories('');
    setLogRefinedCarbs(false);
    setLogExerciseMinutes('');
    setLogSystolic('');
    setLogDiastolic('');
    setLogWeight('');
    setLogWaist('');
    setLogGlucose('');
    setLogTriglycerides('');
    setLogHdl('');
    setLogLdl('');
    setMealDescription('');
    setErrors({});
    
    setCurrentScreen('dashboard');
  };

  const renderLogging = () => (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      className="flex flex-col h-full bg-slate-50"
    >
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Daily Log</h2>
            <p className="text-sm text-slate-500">Track your health metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
          <Sparkles size={16} />
          <span>💡 Use AI Assistant to analyze meals</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="space-y-4 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <Utensils size={16} />
              </div>
              <h3 className="font-semibold text-slate-900">Nutrition</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={logCalories}
                  onChange={(e) => setLogCalories(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logCalories && "ring-2 ring-red-500")}
                />
                {errors.logCalories && <p className="text-[10px] text-red-500">{errors.logCalories}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="carb"
                  checked={logRefinedCarbs}
                  onChange={(e) => setLogRefinedCarbs(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="carb" className="text-xs font-medium text-slate-500">Refined Carbs?</label>
              </div>
              <p className="text-[11px] text-slate-400">💡 Ask the AI assistant to analyze meals</p>
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                <Activity size={16} />
              </div>
              <h3 className="font-semibold text-slate-900">Activity</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Minutes</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={logExerciseMinutes}
                  onChange={(e) => setLogExerciseMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logExerciseMinutes && "ring-2 ring-red-500")}
                />
                {errors.logExerciseMinutes && <p className="text-[10px] text-red-500">{errors.logExerciseMinutes}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Type</label>
                <select 
                  value={logExerciseType}
                  onChange={(e) => setLogExerciseType(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
                >
                  <option>Walking</option>
                  <option>Running</option>
                  <option>Cycling</option>
                  <option>Yoga</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                <Stethoscope size={16} />
              </div>
              <h3 className="font-semibold text-slate-900">Vitals</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Systolic</label>
                <input 
                  type="number" 
                  placeholder="120" 
                  value={logSystolic}
                  onChange={(e) => setLogSystolic(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logSystolic && "ring-2 ring-red-500")}
                />
                {errors.logSystolic && <p className="text-[10px] text-red-500">{errors.logSystolic}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Diastolic</label>
                <input 
                  type="number" 
                  placeholder="80" 
                  value={logDiastolic}
                  onChange={(e) => setLogDiastolic(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logDiastolic && "ring-2 ring-red-500")}
                />
                {errors.logDiastolic && <p className="text-[10px] text-red-500">{errors.logDiastolic}</p>}
              </div>
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                <Scale size={16} />
              </div>
              <h3 className="font-semibold text-slate-900">Body Measurements</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Weight (kg)</label>
                <input 
                  type="number" 
                  placeholder="80.0" 
                  value={logWeight}
                  onChange={(e) => setLogWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logWeight && "ring-2 ring-red-500")}
                />
                {errors.logWeight && <p className="text-[10px] text-red-500">{errors.logWeight}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Waist (cm)</label>
                <input 
                  type="number" 
                  placeholder="90" 
                  value={logWaist}
                  onChange={(e) => setLogWaist(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logWaist && "ring-2 ring-red-500")}
                />
                {errors.logWaist && <p className="text-[10px] text-red-500">{errors.logWaist}</p>}
              </div>
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                <Droplets size={16} />
              </div>
              <h3 className="font-semibold text-slate-900">Lab Results</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Fasting Glucose (mg/dL)</label>
                <input 
                  type="number" 
                  placeholder="100" 
                  value={logGlucose}
                  onChange={(e) => setLogGlucose(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logGlucose && "ring-2 ring-red-500")}
                />
                {errors.logGlucose && <p className="text-[10px] text-red-500">{errors.logGlucose}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Triglycerides (mg/dL)</label>
                <input 
                  type="number" 
                  placeholder="150" 
                  value={logTriglycerides}
                  onChange={(e) => setLogTriglycerides(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logTriglycerides && "ring-2 ring-red-500")}
                />
                {errors.logTriglycerides && <p className="text-[10px] text-red-500">{errors.logTriglycerides}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">HDL (mg/dL)</label>
                <input 
                  type="number" 
                  placeholder="50" 
                  value={logHdl}
                  onChange={(e) => setLogHdl(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logHdl && "ring-2 ring-red-500")}
                />
                {errors.logHdl && <p className="text-[10px] text-red-500">{errors.logHdl}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">LDL (mg/dL)</label>
                <input 
                  type="number" 
                  placeholder="100" 
                  value={logLdl}
                  onChange={(e) => setLogLdl(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={cn("w-full bg-slate-50 border-none rounded-xl p-3 text-sm", errors.logLdl && "ring-2 ring-red-500")}
                />
                {errors.logLdl && <p className="text-[10px] text-red-500">{errors.logLdl}</p>}
              </div>
            </div>
          </Card>
        </div>

        <button 
          onClick={handleSaveLog}
          className="w-full bg-black text-white py-4 rounded-2xl font-semibold shadow-md lg:max-w-xs mx-auto block active:scale-[0.98] transition-transform"
        >
          Save Data
        </button>
      </div>
    </motion.div>
  );

  const renderAnalytics = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-slate-50"
    >
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-900">Progress Analytics</h2>
        <p className="text-sm text-slate-500">Your health trends over the last 7 days.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Weight Trend</h3>
              <span className="text-xs font-bold text-emerald-500">-1.1 kg</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TRENDS}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#10B981" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Blood Pressure</h3>
              <span className="text-xs font-bold text-blue-500">Improving</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_TRENDS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="bp" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Composite Risk</h3>
              <span className="text-xs font-bold text-blue-500">-17% reduction</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TRENDS}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#6366f1" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  const renderAIAssistant = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-slate-50"
    >
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">AI Health Assistant</h2>
            <p className="text-xs text-slate-500 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Powered by Gemini Pro
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
        {chatMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <MessageSquare size={48} className="text-slate-300" />
            <div className="space-y-1">
              <p className="font-medium text-slate-600">How can I help?</p>
              <p className="text-xs text-slate-400 max-w-xs">Log meals, track vitals, get health advice, or create a prevention plan.</p>
            </div>
          </div>
        )}
        
        {chatMessages.map((msg, i) => {
          if (msg.functionResponse) return null; // Hide internal function responses
          return (
            <div 
              key={i} 
              className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white self-end rounded-tr-none" 
                  : msg.functionCall ? "bg-transparent p-0" : "bg-white text-slate-700 self-start rounded-tl-none shadow-sm border border-slate-100"
              )}
            >
              {msg.image && (
                <img src={msg.image} alt="Uploaded" className="w-full h-auto rounded-lg mb-2 object-cover max-h-48" />
              )}
              {msg.text && (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
              
              {msg.functionCall && (
                <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Database size={18} />
                    <span className="font-bold text-sm">Log Data Request</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto">
                    {Object.entries(msg.functionCall.args).map(([k, v]) => (
                      <div key={k}><span className="font-bold">{k}:</span> {String(v)}</div>
                    ))}
                  </div>
                  {!msg.confirmed ? (
                    <div className="flex space-x-2 pt-2">
                      <button onClick={() => confirmFunctionCall(i)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">Confirm & Log</button>
                      <button onClick={() => cancelFunctionCall(i)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 font-bold flex items-center pt-2"><Check size={14} className="mr-1"/> Logged Successfully</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {isTyping && (
          <div className="bg-white text-slate-700 self-start p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center space-x-2">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium text-slate-400">Gemini is thinking...</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        {chatImage && (
          <div className="relative inline-block mb-3">
            <img src={chatImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
            <button onClick={() => setChatImage(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2 bg-slate-50 rounded-2xl p-2 border border-slate-200">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Camera size={20} />
          </button>
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a question or log data..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2"
          />
          <button 
            onClick={handleSendMessage}
            disabled={(!chatInput.trim() && !chatImage) || isTyping}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3">
          AI advice is for informational purposes. Consult a doctor for medical decisions.
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      {(currentScreen !== 'onboarding' && currentScreen !== 'auth') && (
        <div className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col p-6 space-y-8">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Heart size={20} fill="currentColor" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">G-Health</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => setCurrentScreen('dashboard')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors",
                currentScreen === 'dashboard' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('analytics')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors",
                currentScreen === 'analytics' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Activity size={20} />
              <span>Analytics</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('logging')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors",
                currentScreen === 'logging' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Plus size={20} />
              <span>Daily Log</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('assessment')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors",
                currentScreen === 'assessment' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <User size={20} />
              <span>Profile</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('ai_assistant')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors",
                currentScreen === 'ai_assistant' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Sparkles size={20} />
              <span>AI Assistant</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-100">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 h-screen overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className={cn(
            "h-full mx-auto transition-all duration-500",
            (currentScreen === 'onboarding' || currentScreen === 'auth') ? "max-w-none" : "max-w-5xl"
          )}>
            <AnimatePresence mode="wait">
              {currentScreen === 'onboarding' && renderOnboarding()}
              {currentScreen === 'auth' && renderAuth()}
              {currentScreen === 'assessment' && renderAssessment()}
              {currentScreen === 'dashboard' && renderDashboard()}
              {currentScreen === 'logging' && renderLogging()}
              {currentScreen === 'analytics' && renderAnalytics()}
              {currentScreen === 'ai_assistant' && renderAIAssistant()}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        {(currentScreen !== 'onboarding' && currentScreen !== 'auth') && (
          <div className="md:hidden bg-white border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
            <button 
              onClick={() => setCurrentScreen('dashboard')} 
              className={cn(currentScreen === 'dashboard' ? "text-blue-600" : "text-slate-300")}
            >
              <Home size={24} />
            </button>
            <button 
              onClick={() => setCurrentScreen('logging')} 
              className={cn(currentScreen === 'logging' ? "text-blue-600" : "text-slate-300")}
            >
              <Plus size={24} />
            </button>
            <button 
              onClick={() => setCurrentScreen('analytics')} 
              className={cn(currentScreen === 'analytics' ? "text-blue-600" : "text-slate-300")}
            >
              <Activity size={24} />
            </button>
            <button 
              onClick={() => setCurrentScreen('ai_assistant')} 
              className={cn(currentScreen === 'ai_assistant' ? "text-blue-600" : "text-slate-300")}
            >
              <Sparkles size={24} />
            </button>
            <button 
              onClick={() => setCurrentScreen('assessment')} 
              className={cn(currentScreen === 'assessment' ? "text-blue-600" : "text-slate-300")}
            >
              <User size={24} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
