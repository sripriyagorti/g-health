import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Camera, Send, Sparkles, Loader2, X, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/PageHeader';
import { GenerativeUICard } from '../components/GenerativeUICard';
import { ChatMetricsCard, buildWeightMetric, buildBPMetric, buildGlucoseMetric } from '../components/ChatMetricsCard';
import { ChatTrendChart } from '../components/ChatTrendChart';
import { cn } from '../lib/utils';
import type { ChatMessage, PendingFunctionCall, PendingFunctionName } from '../types';

const QUICK = [
  "I had a masala dosa for breakfast",
  "BP 128/82 this morning",
  "Walked 30 min",
  "Weight 78.5 kg",
];

function detectMetricsToShow(text: string, data: any): Array<{ type: 'weight' | 'bp' | 'glucose'; data: any }> {
  const shown: Array<{ type: 'weight' | 'bp' | 'glucose'; data: any }> = [];
  const lowerText = text.toLowerCase();

  if ((lowerText.includes('weight') || lowerText.includes('kg')) && data?.logs) {
    const weightLogs = data.logs.filter((l: any) => l.type === 'weight').slice(0, 2);
    if (weightLogs.length >= 2) {
      shown.push({ type: 'weight', data: weightLogs });
    }
  }

  if ((lowerText.includes('bp') || lowerText.includes('blood pressure')) && data?.logs) {
    const bpLogs = data.logs.filter((l: any) => l.type === 'bp').slice(0, 1);
    if (bpLogs.length > 0) {
      shown.push({ type: 'bp', data: bpLogs });
    }
  }

  if ((lowerText.includes('glucose') || lowerText.includes('sugar')) && data?.biomarkers) {
    const glucoseBM = data.biomarkers.filter((b: any) => b.markerType === 'fasting_glucose').slice(0, 1);
    if (glucoseBM.length > 0) {
      shown.push({ type: 'glucose', data: glucoseBM });
    }
  }

  return shown;
}

function messagesForAPI(msgs: ChatMessage[]) {
  return msgs
    .filter(m => m.text || m.image)
    .map(m => {
      const parts: any[] = [];
      if (m.text) parts.push({ text: m.text });
      if (m.image) {
        const mimeType = m.image.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
        const data = m.image.split(',')[1];
        parts.push({ inlineData: { data, mimeType } });
      }
      return { role: m.role === 'ai' ? 'model' : 'user', parts };
    });
}

export function Chat() {
  const { user } = useAuth();
  const { refresh, biomarkers } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text && !image) return;

    const userMsg: ChatMessage = { role: 'user', text: text || undefined, image: image || undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setImage(null);
    setTyping(true);

    try {
      const { text: reply, pendingCalls, trends } = await api.aiChat(messagesForAPI(next), user?.id);
      const aiMsg: ChatMessage = {
        role: 'ai',
        text: reply || undefined,
        pendingCalls: pendingCalls as PendingFunctionCall[],
        confirmed: {},
        cancelled: {},
        trends: (pendingCalls.length === 0 && trends) ? trends as ChatMessage['trends'] : undefined,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Sorry — ${e.message}` }]);
    } finally {
      setTyping(false);
    }
  }

  async function confirmCall(msgIdx: number, call: PendingFunctionCall) {
    if (!user?.id) return;
    try {
      await executeCall(user.id, call);
      setMessages(prev => {
        const next = [...prev];
        const m = next[msgIdx];
        next[msgIdx] = { ...m, confirmed: { ...(m.confirmed || {}), [call.id]: true } };
        return next;
      });
      refresh();
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Couldn't log: ${e.message}` }]);
    }
  }

  function cancelCall(msgIdx: number, call: PendingFunctionCall) {
    setMessages(prev => {
      const next = [...prev];
      const m = next[msgIdx];
      next[msgIdx] = { ...m, cancelled: { ...(m.cancelled || {}), [call.id]: true } };
      return next;
    });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
      <PageHeader
        title="AI Coach"
        subtitle="Chat, photo, or voice — I'll handle the logging."
        right={
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-good-700 bg-good-50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-good-500 rounded-full animate-pulse" /> Online
          </div>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-8 py-5 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-700">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="font-semibold text-ink">How can I help today?</p>
              <p className="text-sm text-ink-muted mt-0.5">Log meals, BP, weight, labs, or medications by just chatting.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 max-w-2xl">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)} className="text-left text-xs px-3.5 py-3 rounded-2xl bg-surface border border-line hover:border-brand-300 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const metricsToShow = m.role === 'ai' && m.text ? detectMetricsToShow(m.text, { biomarkers }) : [];
          return (
            <div key={i} className={cn('flex flex-col gap-2 max-w-[85%] md:max-w-[70%]', m.role === 'user' ? 'self-end ml-auto items-end' : 'items-start')}>
              {m.image && (
                <img src={m.image} alt="" className="rounded-2xl max-h-64 object-cover" />
              )}
              {m.text && (
                <div className={cn(
                  'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-brand-700 text-white rounded-tr-md'
                    : 'bg-surface border border-line text-ink rounded-tl-md'
                )}>
                  {m.role === 'ai' ? <div className="markdown-body"><ReactMarkdown>{m.text}</ReactMarkdown></div> : m.text}
                </div>
              )}
              {metricsToShow.map((metric) => {
                if (metric.type === 'weight' && metric.data.length >= 2) {
                  const [latest, prev] = metric.data;
                  return (
                    <ChatMetricsCard
                      key={`${i}-weight`}
                      title="Your weight trend"
                      subtitle="Recent readings"
                      metrics={[
                        buildWeightMetric(latest.data.weight, prev.data.weight),
                        { label: 'Previous', value: prev.data.weight?.toFixed(1) || '—', unit: 'kg', status: 'info' },
                      ]}
                      action="Check the Dashboard for a full trend chart"
                    />
                  );
                }
                if (metric.type === 'bp' && metric.data.length > 0) {
                  const latest = metric.data[0];
                  return (
                    <ChatMetricsCard
                      key={`${i}-bp`}
                      title="Your blood pressure"
                      subtitle="Latest reading"
                      metrics={buildBPMetric(latest.data.systolic, latest.data.diastolic)}
                      action="Normal range is 120/80 or lower. Higher = more strain on your heart."
                    />
                  );
                }
                if (metric.type === 'glucose' && metric.data.length > 0) {
                  const latest = metric.data[0];
                  return (
                    <ChatMetricsCard
                      key={`${i}-glucose`}
                      title="Your fasting glucose"
                      subtitle="Latest test result"
                      metrics={[buildGlucoseMetric(latest.value)]}
                      action="Below 100 is normal. 100-125 = prediabetic range. Consult your doctor."
                    />
                  );
                }
                return null;
              })}
              {m.trends?.map((trend, ti) => (
                <div key={`${i}-trend-${ti}`} className="bg-surface border border-line rounded-2xl p-4">
                  <ChatTrendChart type={trend.type as any} data={trend.data} marker_type={trend.marker_type} />
                </div>
              ))}
              {m.pendingCalls?.map(call => (
                <GenerativeUICard
                  key={call.id}
                  call={call}
                  confirmed={m.confirmed?.[call.id]}
                  cancelled={m.cancelled?.[call.id]}
                  onConfirm={() => confirmCall(i, call)}
                  onCancel={() => cancelCall(i, call)}
                />
              ))}
            </div>
          );
        })}

        {typing && (
          <div className="self-start bg-surface border border-line px-4 py-3 rounded-2xl rounded-tl-md inline-flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 size={14} className="animate-spin text-brand-600" /> Thinking…
          </div>
        )}
      </div>

      <div className="shrink-0 bg-surface/95 backdrop-blur-md border-t border-line p-3 md:p-5">
        {image && (
          <div className="inline-block relative mb-2">
            <img src={image} alt="" className="h-16 w-16 object-cover rounded-xl" />
            <button onClick={() => setImage(null)} className="absolute -top-1.5 -right-1.5 bg-ink text-white rounded-full p-1 shadow"><X size={10} /></button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-surface-muted rounded-2xl border border-line px-2 py-1.5 focus-within:border-brand-500">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
          <button onClick={() => fileRef.current?.click()} className="p-2 text-ink-muted hover:text-brand-700 transition-colors">
            <Camera size={18} />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Log a meal, ask a question…"
            className="flex-1 bg-transparent border-none outline-none text-sm py-2"
          />
          <Button variant="primary" size="sm" onClick={() => send()} disabled={typing || (!input.trim() && !image)}>
            <Send size={16} />
          </Button>
        </div>
        <p className="text-center text-[10px] text-ink-soft mt-2 flex items-center justify-center gap-1">
          <MessageSquare size={10} /> Advice is informational. Consult your clinician.
        </p>
      </div>
    </motion.div>
  );
}

async function executeCall(userId: string, call: PendingFunctionCall) {
  const args = call.args || {};
  const name = call.name as PendingFunctionName;
  if (name === 'log_meal') {
    await api.createLog(userId, {
      type: 'food',
      data: {
        name: args.meal_name,
        calories: args.calories,
        portion: args.portion_size,
        protein_g: args.protein_g,
        carbs_g: args.carbs_g,
        fat_g: args.fat_g,
        fiber_g: args.fiber_g,
        sodium_mg: args.sodium_mg,
        usda_fdcId: args.usda_fdc_id,
        source: 'ai_from_text',
      },
    });
  } else if (name === 'log_weight') {
    await api.createLog(userId, { type: 'weight', data: { weight: args.weight_kg } });
  } else if (name === 'log_bp') {
    await api.createLog(userId, { type: 'bp', data: { systolic: args.systolic, diastolic: args.diastolic } });
  } else if (name === 'log_exercise') {
    await api.createLog(userId, { type: 'exercise', data: { type: args.exercise_type, durationMinutes: args.duration_minutes, intensity: args.intensity } });
  } else if (name === 'log_biomarker') {
    await api.createBiomarker(userId, {
      markerType: args.marker_type,
      value: args.value,
      unit: args.unit,
      testDate: args.test_date,
      source: 'ai_extracted',
    });
  } else if (name === 'log_medication_adherence') {
    const { medications } = await api.listMedications(userId);
    const match = medications.find(m => (m.name || '').toLowerCase().includes((args.medication_name || '').toLowerCase()));
    if (!match) throw new Error(`Add "${args.medication_name}" under Medications first.`);
    await api.saveAdherence(userId, {
      medicationId: String(match._id),
      date: args.date,
      taken: args.taken,
      notes: args.notes,
    });
  } else if (name === 'add_medication') {
    await api.createMedication(userId, {
      name: args.medication_name,
      dosage: args.dosage,
      frequency: args.frequency,
      indication: args.indication || '',
      active: true,
    });
  } else if (name === 'log_medication_taken') {
    const { medications } = await api.listMedications(userId);
    const match = medications.find(m => (m.name || '').toLowerCase().includes((args.medication_name || '').toLowerCase()));
    if (!match) throw new Error(`"${args.medication_name}" not found. Add it first.`);
    const today = new Date().toISOString().slice(0, 10);
    await api.saveAdherence(userId, {
      medicationId: String(match._id),
      date: today,
      taken: true,
    });
  } else if (name === 'extract_lab_results') {
    const results = [];
    const testDate = args.test_date || new Date().toISOString();
    const markers = ['glucose', 'total_cholesterol', 'hdl', 'ldl', 'triglycerides', 'crp', 'hba1c'];
    for (const marker of markers) {
      const value = args[marker];
      if (value) {
        const units: Record<string, string> = {
          glucose: 'mg/dL',
          total_cholesterol: 'mg/dL',
          hdl: 'mg/dL',
          ldl: 'mg/dL',
          triglycerides: 'mg/dL',
          crp: 'mg/L',
          hba1c: '%',
        };
        results.push(
          api.createLog(userId, {
            type: 'biomarker',
            data: {
              markerType: marker === 'glucose' ? 'fasting_glucose' : marker,
              value,
              unit: units[marker],
              testDate,
              source: args.source === 'photo' ? 'lab_report_photo' : 'lab_report_text',
            },
          })
        );
      }
    }
    await Promise.all(results);
  }
}
