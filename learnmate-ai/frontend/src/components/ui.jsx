import { AlertTriangle, Info, Loader2 } from 'lucide-react';

export const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
);

const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
  white: 'bg-white text-indigo-700 hover:bg-indigo-50',
};
export const Button = ({ variant = 'primary', loading, className = '', children, ...p }) => (
  <button {...p} disabled={p.disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}>
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}
  </button>
);

export const Spinner = ({ className = 'h-5 w-5' }) => <Loader2 className={`animate-spin ${className}`} />;
export const Skeleton = ({ className = 'h-24' }) => <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;

export const Empty = ({ icon: Icon, title, text, children }) => (
  <div className="px-6 py-14 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon className="h-7 w-7" /></div>
    <p className="font-semibold">{title}</p>
    {text && <p className="mx-auto mb-4 mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    {children}
  </div>
);

const TONES = {
  warn: ['border-amber-200 bg-amber-50 text-amber-900', AlertTriangle],
  error: ['border-rose-200 bg-rose-50 text-rose-800', AlertTriangle],
  info: ['border-indigo-200 bg-indigo-50 text-indigo-900', Info],
};
export const Alert = ({ tone = 'info', title, children, action }) => {
  const [cls, Icon] = TONES[tone];
  return (
    <div role="alert" className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm ${cls}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">{title && <p className="font-semibold">{title}</p>}<div>{children}</div></div>
      {action}
    </div>
  );
};

export const Badge = ({ className = '', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
);

export const ErrorState = ({ message, onRetry }) => (
  <Alert tone="error" title="Something went wrong" action={onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}>{message}</Alert>
);

export const DocSelect = ({ docs, value, onChange, className = '' }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Select document"
    className={`rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}>
    {docs.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
  </select>
);
