import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 90000 });

http.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const d = err.response?.data;
    const e = new Error(d?.error || (err.code === 'ERR_NETWORK' ? 'Cannot reach the backend. Is it running on port 5000?' : err.message));
    e.code = d?.code;
    e.status = err.response?.status;
    return Promise.reject(e);
  },
);

export const api = {
  status: () => http.get('/settings/status'),
  probe: () => http.post('/settings/probe'),
  setDemo: (demoMode) => http.put('/settings', { demoMode }),
  docs: () => http.get('/documents'),
  upload: (file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post('/documents', fd, { onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total || 1))) });
  },
  docPage: (id, n) => http.get(`/documents/${id}/pages/${n}`),
  deleteDoc: (id) => http.delete(`/documents/${id}`),
  ask: (body) => http.post('/tutor/ask', body),
  generateQuiz: (documentId, count) => http.post('/quiz/generate', { documentId, count }),
  submitQuiz: (id, answers, durationSec) => http.post(`/quiz/${id}/submit`, { answers, durationSec }),
  attempt: (id) => http.get(`/quiz/attempts/${id}`),
  progress: () => http.get('/progress'),
  plan: () => http.get('/planner'),
  generatePlan: (days) => http.post('/planner/generate', { days }),
  toggleTask: (planId, taskId, done) => http.patch(`/planner/${planId}/tasks/${taskId}`, { done }),
};
