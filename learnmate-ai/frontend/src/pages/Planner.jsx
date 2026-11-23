import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, CalendarPlus, MessageSquare, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { LEVEL_STYLE, useLoad } from '../hooks.js';
import { Alert, Badge, Button, Card, Empty, ErrorState, Skeleton } from '../components/ui.jsx';

const TYPE = { quiz: [Brain, '/quiz', 'Take quiz'], tutor: [MessageSquare, '/tutor', 'Open tutor'], revise: [BookOpen, null, ''] };

export default function Planner() {
  const plan = useLoad(api.plan);
  const prog = useLoad(api.progress);
  const { toast } = useApp();
  const [days, setDays] = useState(5);
  const [busy, setBusy] = useState(false);
  const [genError, setGenError] = useState(null);

  async function generate() {
    setBusy(true); setGenError(null);
    try { plan.setData(await api.generatePlan(days)); toast('Your study plan is ready.'); }
    catch (e) { setGenError(e); } finally { setBusy(false); }
  }
  async function toggle(taskId, done) {
    try { plan.setData(await api.toggleTask(plan.data._id, taskId, done)); } catch (e) { toast(e.message, 'error'); }
  }

  if (plan.error) return <ErrorState message={plan.error} onRetry={plan.reload} />;
  if (plan.loading || prog.loading) return <div className="space-y-6"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const p = plan.data;
  const targets = (prog.data?.mastery || []).filter((m) => m.level !== 'strong').sort((a, b) => a.percent - b.percent);
  const all = p ? p.days.flatMap((d) => d.tasks) : [];
  const done = all.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 border-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div><h2 className="text-lg font-bold">Adaptive study plan</h2><p className="text-sm text-indigo-100">Built from your real quiz history, targeting your weakest topics first.</p></div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Plan length" className="rounded-xl bg-white/20 px-3 py-2.5 text-sm text-white focus:outline-none">{[3, 5, 7].map((n) => <option key={n} value={n} className="text-slate-900">{n} days</option>)}</select>
          <Button variant="white" onClick={generate} loading={busy}>{!busy && <Sparkles className="h-4 w-4" />}{busy ? 'Generating…' : p ? 'Regenerate' : 'Generate plan'}</Button>
        </div>
      </Card>
      {genError && <Alert tone={genError.code === 'NO_QUIZ_HISTORY' ? 'info' : 'error'} title={genError.code === 'NO_QUIZ_HISTORY' ? 'Take a quiz first' : 'Could not generate a plan'}
        action={genError.code === 'NO_QUIZ_HISTORY' ? <Link to="/quiz"><Button variant="secondary">Take a quiz</Button></Link> : genError.code === 'GEMINI_NOT_CONFIGURED' ? <Link to="/settings"><Button variant="secondary">Settings</Button></Link> : null}>{genError.message}</Alert>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6"><h3 className="mb-3 font-semibold">Recommended topics</h3>
          {targets.length ? <div className="space-y-2">{targets.map((m) => <div key={m.topic} className={`flex items-center justify-between rounded-xl p-3 text-sm ${LEVEL_STYLE[m.level].chip}`}><span className="font-medium">{m.topic}</span><b>{m.percent}%</b></div>)}</div>
            : <p className="text-sm text-slate-500">{prog.data?.mastery.length ? 'Every topic is Strong. Keep practising to stay sharp!' : 'Take a quiz to discover which topics need work.'}</p>}
        </Card>
        <Card className="p-6 lg:col-span-2">
          {p ? (<>
            <div className="mb-1 flex items-center justify-between"><h3 className="font-semibold">Your plan</h3><Badge className="bg-slate-100 text-slate-600">{done}/{all.length} done</Badge></div>
            <p className="mb-4 text-sm text-slate-500">{p.summary}</p>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} /></div>
            <div className="space-y-5">{p.days.map((d) => (
              <div key={d._id}><p className="mb-2 text-sm font-semibold">Day {d.day} · {d.title}</p><ul className="space-y-2">{d.tasks.map((t) => { const [Icon, to, label] = TYPE[t.type]; return (
                <li key={t._id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                  <input type="checkbox" checked={t.done} onChange={(e) => toggle(t._id, e.target.checked)} aria-label={t.text} className="mt-1 h-4 w-4 accent-indigo-600" />
                  <span className={`flex-1 text-sm ${t.done ? 'text-slate-400 line-through' : ''}`}>{t.text}</span>
                  {to && <Link to={to} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"><Icon className="h-3.5 w-3.5" />{label}</Link>}
                  <span className="whitespace-nowrap text-xs text-slate-500">{t.minutes} min</span>
                </li>); })}</ul></div>))}</div>
          </>) : <Empty icon={CalendarPlus} title="No plan yet" text="Generate a plan to get daily revision tasks based on your quiz results." />}
        </Card>
      </div>
    </div>
  );
}
