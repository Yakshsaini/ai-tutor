import { Link } from 'react-router-dom';
import { AlertTriangle, Brain, CalendarCheck, FileUp, Files, Flame, Inbox, MessageSquare, Target } from 'lucide-react';
import { api } from '../api.js';
import { LEVEL_STYLE, fmtDate, useLoad } from '../hooks.js';
import { Alert, Button, Card, Empty, ErrorState, Skeleton } from '../components/ui.jsx';

const ACTIONS = [['/documents', FileUp, 'Upload a PDF'], ['/tutor', MessageSquare, 'Ask the AI tutor'], ['/quiz', Brain, 'Start a practice quiz'], ['/planner', CalendarCheck, 'Build a study plan']];

export default function Dashboard() {
  const { data, loading, error, reload } = useLoad(api.progress);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <div className="space-y-6"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} />)}</div><Skeleton className="h-64" /></div>;

  const { stats, weakTopics, activity, mastery } = data;
  const cards = [
    ['Total Docs', stats.totalDocs, Files, 'bg-indigo-50 text-indigo-600'], ['Quizzes Taken', stats.quizzesTaken, Brain, 'bg-purple-50 text-purple-600'],
    ['Average Score', `${stats.avgScore}%`, Target, 'bg-emerald-50 text-emerald-600'], ['Study Streak', `${stats.streak} day${stats.streak === 1 ? '' : 's'}`, Flame, 'bg-amber-50 text-amber-600'],
  ];

  return (
    <div className="space-y-6">
      {weakTopics.length > 0 && (
        <Alert tone="warn" title="Weak topics detected" action={<Link to="/planner"><Button variant="secondary">Fix with a study plan</Button></Link>}>
          You scored below 60% on: <b>{weakTopics.map((t) => t.topic).join(', ')}</b>.
        </Alert>
      )}
      {stats.totalDocs === 0 && <Alert tone="info" title="Welcome to LearnMate" action={<Link to="/documents"><Button>Upload your first PDF</Button></Link>}>Upload study material to unlock the tutor, quizzes and analytics.</Alert>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <Card key={label} className="p-5"><div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {activity.length ? <ul className="space-y-3">{activity.map((a, i) => (
            <li key={i} className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{a.type === 'quiz' ? <Brain className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}</span><span className="flex-1 text-sm">{a.text}</span><span className="whitespace-nowrap text-xs text-slate-400">{fmtDate(a.date)}</span></li>
          ))}</ul> : <Empty icon={Inbox} title="No activity yet" text="Upload a document or take a quiz and it will show up here." />}
        </Card>
        <div className="space-y-6">
          <Card className="p-6"><h2 className="mb-4 font-semibold">Quick actions</h2><div className="space-y-2">
            {ACTIONS.map(([to, Icon, label]) => <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium transition hover:border-indigo-300 hover:bg-indigo-50"><Icon className="h-5 w-5 text-indigo-600" />{label}</Link>)}
          </div></Card>
          {mastery.length > 0 && <Card className="p-6"><h2 className="mb-4 font-semibold">Topic mastery</h2><div className="space-y-3">
            {[...mastery].sort((a, b) => a.percent - b.percent).slice(0, 4).map((m) => (
              <div key={m.topic}><div className="mb-1 flex justify-between text-xs"><span className="font-medium">{m.topic}</span><span>{m.percent}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${LEVEL_STYLE[m.level].bar}`} style={{ width: `${m.percent}%` }} /></div></div>
            ))}
          </div></Card>}
        </div>
      </div>
    </div>
  );
}
