import type { BiomarkerLog, Medication, MedicationAdherence } from './types';

async function json<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data as T;
}

export const api = {
  signup: (body: { email: string; password: string }) =>
    fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ user: any }>),

  login: (body: { email: string; password: string }) =>
    fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ user: any }>),

  updateUser: (id: string, body: any) =>
    fetch(`/api/auth/user/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ user: any }>),

  getUser: (id: string) =>
    fetch(`/api/auth/user/${id}`).then(json<{ user: any }>),

  listLogs: (userId: string, params?: { type?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return fetch(`/api/logs/${userId}${qs ? '?' + qs : ''}`).then(json<{ logs: any[]; total: number }>);
  },

  createLog: (userId: string, body: { type: string; data: any; timestamp?: string }) =>
    fetch(`/api/logs/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ log: any }>),

  listBiomarkers: (userId: string) =>
    fetch(`/api/biomarkers/${userId}`).then(json<{ biomarkers: any[] }>),

  createBiomarker: (userId: string, body: Partial<BiomarkerLog>) =>
    fetch(`/api/biomarkers/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ biomarker: any }>),

  deleteBiomarker: (userId: string, id: string) =>
    fetch(`/api/biomarkers/${userId}/${id}`, { method: 'DELETE' }).then(json<{ ok: true }>),

  listMedications: (userId: string) =>
    fetch(`/api/medications/${userId}`).then(json<{ medications: any[] }>),

  createMedication: (userId: string, body: Partial<Medication>) =>
    fetch(`/api/medications/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ medication: any }>),

  deleteMedication: (userId: string, id: string) =>
    fetch(`/api/medications/${userId}/${id}`, { method: 'DELETE' }).then(json<{ ok: true }>),

  listAdherence: (userId: string, medicationId?: string) => {
    const q = medicationId ? `?medicationId=${medicationId}` : '';
    return fetch(`/api/medications/${userId}/adherence${q}`).then(json<{ adherence: any[] }>);
  },

  saveAdherence: (userId: string, body: Partial<MedicationAdherence>) =>
    fetch(`/api/medications/${userId}/adherence`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json<{ adherence: any }>),

  searchFood: (q: string, portion?: string) => {
    const qs = new URLSearchParams({ q });
    if (portion) qs.set('portion', portion);
    return fetch(`/api/food/search?${qs}`).then(json<{ results: any[] }>);
  },

  aiChat: (messages: any[], userId?: string) =>
    fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, userId }) }).then(json<{ text: string; pendingCalls: Array<{ id: string; name: string; args: any }>; trends?: Array<{ type: string; data: any; marker_type?: string }> }>),

  generatePlan: (userId: string) =>
    fetch('/api/generate-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) }).then(json<{ plan: string }>),

  profileSummary: (profile: Record<string, any>) =>
    fetch('/api/ai/profile-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) }).then(json<{ bullets: Array<{ insight: string; action: string }> }>),

  demoReset: () =>
    fetch('/api/demo/reset', { method: 'POST' }).then(json<{ ok: boolean; logs: number }>),
};
