import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const refreshStatus = useCallback(async () => {
    try { setStatus(await api.status()); setStatusError(null); }
    catch (e) { setStatus(null); setStatusError(e.message); }
  }, []);
  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  return (
    <Ctx.Provider value={{ toast, status, statusError, refreshStatus }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-md ${t.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'}`}>
            {t.type === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
