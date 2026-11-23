import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { History } from 'lucide-react';
import { api } from '../api.js';
import { LEVEL_STYLE, fmtDate, useLoad } from '../hooks.js';
import { Badge, Button, Card, Empty, ErrorState, Skeleton } from '../components/ui.jsx';

const scoreLevel = (s) => (s < 60 ? 'weak' : s <= 80 ? 'developing' : 'strong');

export default function Progress() {
  const { data, loading, error, reload } = useLoad(api.progress);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <div className="space-y-6"><Skeleton className="h-72" /><Skeleton className="h-60" /></div>;
  if (!data.history.length) return <Card><Empty icon={History} title="No quiz attempts yet" text="Take a practice quiz and your mastery analytics will appear here."><Link to="/quiz"><Button>Take a quiz</Button></Link></Empty></Card>;

  const { mastery, history, trend } = data;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Topic mastery</h2>
          <p className="mb-4 text-xs text-slate-500">Weak &lt; 60% · Developing 60-80% · Strong &gt; 80%</p>
          <div className="h-64"><ResponsiveContainer>
            <BarChart data={mastery} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="topic" tick={{ fontSize: 11 }} interval={0} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n, p) => [`${v}% (${p.payload.correct}/${p.payload.total})`, 'Mastery']} /><ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="4 4" /><ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" />
              <Bar dataKey="percent" radius={[8, 8, 0, 0]}>{mastery.map((m) => <Cell key={m.topic} fill={LEVEL_STYLE[m.level].hex} />)}</Bar></BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Score trend</h2>
          <div className="h-64"><ResponsiveContainer>
            <LineChart data={trend.map((t, i) => ({ ...t, label: `#${i + 1}` }))} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(l, p) => (p[0] ? fmtDate(p[0].payload.date) : l)} /><Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
          </ResponsiveContainer></div>
        </Card>
      </div>
      <Card className="p-6"><h2 className="mb-4 font-semibold">Mastery by topic</h2><div className="space-y-4">
        {mastery.map((m) => { const s = LEVEL_STYLE[m.level]; return (
          <div key={m.topic}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium">{m.topic}</span><span className="flex items-center gap-2"><Badge className={s.chip}>{s.label}</Badge><b>{m.percent}%</b><span className="text-xs text-slate-400">{m.correct}/{m.total}</span></span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${s.bar}`} style={{ width: `${m.percent}%` }} /></div></div>); })}
      </div></Card>
      <Card className="overflow-hidden">
        <div className="p-6 pb-3"><h2 className="font-semibold">Quiz history</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500"><tr>{['Date', 'Document', 'Questions', 'Correct', 'Score'].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{history.map((a) => (
            <tr key={a._id}><td className="px-6 py-3">{fmtDate(a.completedAt)}</td><td className="px-6 py-3">{a.documentName}</td><td className="px-6 py-3">{a.total}</td><td className="px-6 py-3">{a.correctCount}</td><td className="px-6 py-3"><Badge className={LEVEL_STYLE[scoreLevel(a.score)].chip}>{a.score}%</Badge></td></tr>))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
