import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Pill, Trash2, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { IconBadge } from '../components/ui/IconBadge';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/PageHeader';
import { MedicationAdherenceWidget } from '../components/MedicationAdherenceWidget';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../api';
import type { Medication } from '../types';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every other day', 'Weekly', 'As needed'];
const INDICATIONS = ['Hypertension', 'Diabetes', 'Cholesterol', 'Heart disease', 'Thyroid', 'Other'];

function pct(adherence: import('../types').MedicationAdherence[], medicationId: string, days = 30) {
  const today = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const byDate = new Map<string, boolean>();
  for (const a of adherence) {
    if (a.medicationId === medicationId) byDate.set(a.date, a.taken);
  }
  const taken = dates.filter(d => byDate.get(d) === true).length;
  const logged = dates.filter(d => byDate.has(d)).length;
  return logged > 0 ? Math.round((taken / logged) * 100) : null;
}

export function Medications() {
  const { user } = useAuth();
  const { medications, adherence, refreshMeds } = useData();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    startDate: new Date().toISOString().slice(0, 10),
    indication: '',
    notes: '',
  });

  function patch(p: Partial<Medication>) {
    setForm(prev => ({ ...prev, ...p }));
  }

  async function save() {
    if (!user?.id || !form.name || !form.dosage || !form.frequency) return;
    setSaving(true);
    try {
      await api.createMedication(user.id, {
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        startDate: form.startDate || new Date().toISOString().slice(0, 10),
        indication: form.indication || undefined,
        notes: form.notes || undefined,
      });
      await refreshMeds();
      setOpen(false);
      setForm({ name: '', dosage: '', frequency: 'Once daily', startDate: new Date().toISOString().slice(0, 10), indication: '', notes: '' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteMed(id: string) {
    if (!user?.id) return;
    await api.deleteMedication(user.id, id);
    await refreshMeds();
  }

  async function toggleAdherence(medicationId: string, date: string, current: boolean | undefined) {
    if (!user?.id) return;
    await api.saveAdherence(user.id, {
      medicationId,
      date,
      taken: current === true ? false : true,
    });
    await refreshMeds();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
      <PageHeader
        title="Medications"
        subtitle="Track adherence and stay on schedule"
        right={<Button variant="primary" size="sm" onClick={() => setOpen(true)} leftIcon={<Plus size={14} />}>Add</Button>}
      />

      <div className="px-5 md:px-8 py-6 space-y-4 pb-6">
        {open && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-soft">New medication</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Medication name"
                placeholder="e.g. Lisinopril"
                value={form.name || ''}
                onChange={e => patch({ name: e.target.value })}
                className="col-span-2"
              />
              <Input
                label="Dosage"
                placeholder="e.g. 10 mg"
                value={form.dosage || ''}
                onChange={e => patch({ dosage: e.target.value })}
              />
              <Select
                label="Frequency"
                value={form.frequency || 'Once daily'}
                onChange={e => patch({ frequency: e.target.value })}
              >
                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </Select>
              <Input
                label="Start date"
                type="date"
                value={form.startDate || ''}
                onChange={e => patch({ startDate: e.target.value })}
              />
              <Select
                label="Indication (optional)"
                value={form.indication || ''}
                onChange={e => patch({ indication: e.target.value })}
              >
                <option value="">Select condition</option>
                {INDICATIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </Select>
              <Input
                label="Notes (optional)"
                placeholder="Any notes..."
                value={form.notes || ''}
                onChange={e => patch({ notes: e.target.value })}
                className="col-span-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={saving}
                onClick={save}
                disabled={!form.name || !form.dosage}
              >
                Save medication
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {medications.length === 0 && !open && (
          <Card className="text-center py-12 space-y-3">
            <IconBadge tone="info" className="mx-auto"><Pill size={18} /></IconBadge>
            <div>
              <p className="font-semibold text-ink">No medications added</p>
              <p className="text-sm text-ink-muted mt-1">Add your medications to track daily adherence.</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setOpen(true)} leftIcon={<Plus size={14} />}>Add medication</Button>
          </Card>
        )}

        {medications.map(med => {
          const monthPct = pct(adherence, med.id, 30);
          return (
            <Card key={med.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconBadge tone="info" size="sm"><Pill size={15} /></IconBadge>
                  <div>
                    <p className="font-bold text-ink">{med.name}</p>
                    <p className="text-sm text-ink-muted">{med.dosage} · {med.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {monthPct !== null && (
                    <Badge tone={monthPct >= 80 ? 'good' : monthPct >= 50 ? 'warn' : 'bad'}>
                      {monthPct}% this month
                    </Badge>
                  )}
                  <button
                    onClick={() => deleteMed(med.id)}
                    className="p-1.5 rounded-lg text-ink-soft hover:text-bad-600 hover:bg-bad-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {med.indication && (
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Calendar size={12} />
                  <span>For {med.indication} · Started {new Date(med.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {!med.indication && (
                <p className="text-xs text-ink-muted flex items-center gap-1.5">
                  <Calendar size={12} />
                  Started {new Date(med.startDate).toLocaleDateString()}
                </p>
              )}

              <MedicationAdherenceWidget
                medicationId={med.id}
                adherence={adherence}
                days={7}
                onToggle={(date, current) => toggleAdherence(med.id, date, current)}
              />

              {med.notes && (
                <p className="text-xs text-ink-muted bg-surface-muted rounded-xl px-3 py-2">{med.notes}</p>
              )}
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
