import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Droplets } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { IconBadge } from '../components/ui/IconBadge';
import { PageHeader } from '../components/PageHeader';
import { BiomarkerCard } from '../components/BiomarkerCard';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../api';
import type { BiomarkerType } from '../types';

const MARKERS: { value: BiomarkerType; label: string; unit: string }[] = [
  { value: 'fasting_glucose', label: 'Fasting Glucose', unit: 'mg/dL' },
  { value: 'hba1c', label: 'HbA1c', unit: '%' },
  { value: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL' },
  { value: 'hdl', label: 'HDL', unit: 'mg/dL' },
  { value: 'ldl', label: 'LDL', unit: 'mg/dL' },
  { value: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL' },
  { value: 'crp', label: 'CRP', unit: 'mg/L' },
  { value: 'homocysteine', label: 'Homocysteine', unit: 'µmol/L' },
  { value: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL' },
];

export function Biomarkers() {
  const { user } = useAuth();
  const { biomarkers, refreshBiomarkers } = useData();
  const [open, setOpen] = useState(false);
  const [markerType, setMarkerType] = useState<BiomarkerType>('fasting_glucose');
  const [value, setValue] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const unit = MARKERS.find(m => m.value === markerType)?.unit || '';

  async function save() {
    if (!user?.id || !value) return;
    setSaving(true);
    try {
      await api.createBiomarker(user.id, {
        markerType,
        value: parseFloat(value),
        unit,
        testDate,
        source: 'manual_entry',
      });
      await refreshBiomarkers();
      setOpen(false);
      setValue('');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!user?.id) return;
    await api.deleteBiomarker(user.id, id);
    await refreshBiomarkers();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
      <PageHeader
        title="Biomarkers"
        subtitle="Track lab results and inflammation markers"
        right={<Button variant="primary" size="sm" onClick={() => setOpen(true)} leftIcon={<Plus size={14} />}>Add</Button>}
      />

      <div className="px-5 md:px-8 py-6 space-y-3 pb-6">
        {biomarkers.length === 0 && !open && (
          <Card className="text-center py-12 space-y-3">
            <IconBadge tone="warn" className="mx-auto"><Droplets size={18} /></IconBadge>
            <div>
              <p className="font-semibold text-ink">No biomarkers yet</p>
              <p className="text-sm text-ink-muted mt-1">Add lab results manually, or upload a lab PDF in chat.</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setOpen(true)} leftIcon={<Plus size={14} />}>Add first result</Button>
          </Card>
        )}

        {open && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-soft">New biomarker</h3>
            <Select label="Type" value={markerType} onChange={e => setMarkerType(e.target.value as BiomarkerType)}>
              {MARKERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Value" suffix={unit} type="number" step="any" value={value} onChange={e => setValue(e.target.value)} />
              <Input label="Test date" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="md" fullWidth loading={saving} onClick={save}>Save</Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {biomarkers.map(b => (
            <BiomarkerCard key={b.id} biomarker={b} onDelete={onDelete} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
