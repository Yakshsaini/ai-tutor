import { useCallback, useEffect, useState } from 'react';

/** Run an async loader on mount; returns { data, loading, error, reload, setData }. */
export function useLoad(fn) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ data: await fn(), loading: false, error: null }); }
    catch (e) { setState({ data: null, loading: false, error: e.message }); }
  }, [fn]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}

export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
export const LEVEL_STYLE = {
  weak: { label: 'Weak', bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700', hex: '#f43f5e' },
  developing: { label: 'Developing', bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700', hex: '#f59e0b' },
  strong: { label: 'Strong', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', hex: '#10b981' },
};
