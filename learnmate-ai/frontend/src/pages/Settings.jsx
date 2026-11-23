import { useState } from 'react';
import { CheckCircle2, Database, KeyRound, RefreshCw, Server, XCircle } from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { Alert, Badge, Button, Card, Skeleton } from '../components/ui.jsx';

const Row = ({ icon: Icon, label, ok, detail }) => (
  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm"><Icon className="h-5 w-5" /></div>
    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="truncate text-xs text-slate-500">{detail}</p></div>
    {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
  </div>
);

export default function Settings() {
  const { status, statusError, refreshStatus, toast } = useApp();
  const [probing, setProbing] = useState(false);
  const [probe, setProbe] = useState(null);
  const [toggling, setToggling] = useState(false);

  async function toggleDemo() {
    setToggling(true);
    try { await api.setDemo(!status.demoMode); await refreshStatus(); toast(!status.demoMode ? 'Demo Mode enabled.' : 'Demo Mode disabled.'); }
    catch (e) { toast(e.message, 'error'); } finally { setToggling(false); }
  }
  async function test() {
    setProbing(true);
    try { setProbe(await api.probe()); } catch (e) { setProbe({ ok: false, message: e.message }); } finally { setProbing(false); }
  }

  if (statusError) return <Alert tone="error" title="Backend unreachable" action={<Button variant="secondary" onClick={refreshStatus}>Retry</Button>}>{statusError} Start it with <code className="rounded bg-white/70 px-1">npm run dev</code> in <code className="rounded bg-white/70 px-1">backend/</code>.</Alert>;
  if (!status) return <Skeleton className="h-72" />;

  return (
    <div className="max-w-2xl space-y-6">
      {status.warning && <Alert tone="warn" title="Gemini setup needed">{status.warning}</Alert>}
      <Card className="space-y-3 p-6">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Connection status</h2><Button variant="secondary" onClick={refreshStatus}><RefreshCw className="h-4 w-4" />Refresh</Button></div>
        <Row icon={Server} label="Backend API" ok detail={`Running · uptime ${status.server.uptimeSec}s`} />
        <Row icon={Database} label="MongoDB" ok={status.database.ok} detail={status.database.state} />
        <Row icon={KeyRound} label="Gemini API key" ok={status.gemini.configured} detail={status.gemini.configured ? `Key detected on server · model ${status.gemini.model}` : 'Missing. Set GEMINI_API_KEY in backend/.env'} />
        <div className="flex items-center gap-3 pt-1"><Button variant="secondary" onClick={test} loading={probing} disabled={!status.gemini.configured}>Test Gemini connection</Button>
          {probe && <span className={`text-sm ${probe.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{probe.message}</span>}</div>
        <p className="text-xs text-slate-500">The API key lives only in the backend environment. It is never sent to or stored in the browser.</p>
      </Card>
      <Card className="flex items-center justify-between gap-4 p-6">
        <div><div className="flex items-center gap-2"><h2 className="font-semibold">Demo Mode</h2><Badge className="bg-amber-50 text-amber-800">{status.demoMode ? 'ON' : 'OFF'}</Badge></div>
          <p className="mt-1 text-sm text-slate-500">Skips Gemini and builds answers, quizzes and plans directly from your uploaded text. Useful when the key is missing or the network is flaky during a live demo.</p></div>
        <button role="switch" aria-checked={status.demoMode} aria-label="Demo Mode" onClick={toggleDemo} disabled={toggling}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${status.demoMode ? 'bg-indigo-600' : 'bg-slate-300'} disabled:opacity-60`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${status.demoMode ? 'left-6' : 'left-1'}`} />
        </button>
      </Card>
    </div>
  );
}
