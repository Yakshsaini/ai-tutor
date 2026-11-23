import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Files, Play, RotateCcw, Timer, XCircle } from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad } from '../hooks.js';
import { Alert, Badge, Button, Card, DocSelect, Empty, ErrorState, Skeleton } from '../components/ui.jsx';

const mmss = (s) => `${String(Math.floor(Math.max(s, 0) / 60)).padStart(2, '0')}:${String(Math.max(s, 0) % 60).padStart(2, '0')}`;

export default function Quiz() {
  const { data: docs, loading, error, reload } = useLoad(api.docs);
  const { toast } = useApp();
  const [phase, setPhase] = useState('setup');
  const [docId, setDocId] = useState('');
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const started = useRef(0);
  const submitting = useRef(false);
  const latest = useRef({});
  latest.current = { quiz, answers };

  useEffect(() => { if (docs?.length && !docs.some((d) => d._id === docId)) setDocId(docs[0]._id); }, [docs, docId]);

  async function start() {
    setBusy(true); setSetupError(null);
    try {
      const q = await api.generateQuiz(docId, count);
      setQuiz(q); setAnswers(Array(q.questions.length).fill(-1)); setIdx(0); setLeft(q.timeLimitSec);
      started.current = Date.now(); submitting.current = false; setPhase('run');
    } catch (e) { setSetupError(e); } finally { setBusy(false); }
  }

  async function submit(auto = false) {
    if (submitting.current) return;
    submitting.current = true;
    const { quiz: q, answers: a } = latest.current;
    try {
      setResult(await api.submitQuiz(q.attemptId, a, Math.round((Date.now() - started.current) / 1000)));
      setPhase('review');
      if (auto) toast("Time's up. Your quiz was submitted automatically.");
    } catch (e) { submitting.current = false; toast(e.message, 'error'); }
  }

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => { if (phase === 'run' && left <= 0) submit(true); }, [left, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <Skeleton className="h-80" />;
  if (!docs.length) return <Card><Empty icon={Files} title="Upload a document first" text="Quizzes are generated from your PDFs."><Link to="/documents"><Button>Go to My Documents</Button></Link></Empty></Card>;

  if (phase === 'setup') return (
    <Card className="mx-auto max-w-xl space-y-5 p-8">
      <div><h2 className="text-xl font-bold">Test your knowledge</h2><p className="text-sm text-slate-500">Questions are generated from your document and favour your weak topics.</p></div>
      {setupError && <Alert tone="error" title="Could not create the quiz" action={setupError.code === 'GEMINI_NOT_CONFIGURED' && <Link to="/settings"><Button variant="secondary">Settings</Button></Link>}>{setupError.message}</Alert>}
      <label className="block text-sm font-medium">Document<DocSelect docs={docs} value={docId} onChange={setDocId} className="mt-1 w-full" /></label>
      <div><p className="mb-2 text-sm font-medium">Number of questions: {count}</p><input type="range" min="5" max="10" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-indigo-600" aria-label="Question count" /></div>
      <Button onClick={start} loading={busy} className="w-full"><Play className="h-4 w-4" />{busy ? 'Generating questions…' : 'Start quiz'}</Button>
    </Card>
  );

  if (phase === 'run') {
    const q = quiz.questions[idx], answered = answers.filter((a) => a !== -1).length, last = idx === quiz.questions.length - 1;
    return (
      <Card className="mx-auto max-w-2xl space-y-5 p-6 sm:p-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Question {idx + 1} of {quiz.questions.length}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono ${left < 30 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100'}`}><Timer className="h-4 w-4" />{mmss(left)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={answered} aria-valuemax={quiz.questions.length}><div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all" style={{ width: `${(answered / quiz.questions.length) * 100}%` }} /></div>
        <Badge className="bg-purple-50 text-purple-700">{q.topic}</Badge>
        <h2 className="text-lg font-semibold">{q.question}</h2>
        <div className="space-y-3">{q.options.map((o, i) => (
          <button key={i} onClick={() => setAnswers((a) => a.map((v, j) => (j === idx ? i : v)))} aria-pressed={answers[idx] === i}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-sm transition ${answers[idx] === i ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${answers[idx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{'ABCD'[i]}</span>{o}
          </button>))}</div>
        <div className="flex justify-between">
          <Button variant="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Back</Button>
          {last ? <Button onClick={() => (answered < quiz.questions.length && !window.confirm(`${quiz.questions.length - answered} unanswered. Submit anyway?`) ? null : submit())}>Submit quiz</Button> : <Button onClick={() => setIdx(idx + 1)}>Next</Button>}
        </div>
      </Card>
    );
  }

  const tone = result.score > 80 ? 'bg-emerald-500' : result.score >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="p-8 text-center">
        <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white ${tone}`}>{result.score}%</div>
        <h2 className="mt-4 text-xl font-bold">{result.score > 80 ? 'Excellent work!' : result.score >= 60 ? 'Good progress!' : 'Keep practising!'}</h2>
        <p className="text-sm text-slate-500">{result.correctCount} of {result.total} correct · {mmss(result.durationSec)}</p>
        <div className="mt-5 flex justify-center gap-3"><Button onClick={() => { setPhase('setup'); setResult(null); }}><RotateCcw className="h-4 w-4" />New quiz</Button><Link to="/progress"><Button variant="secondary">View progress</Button></Link></div>
      </Card>
      <h3 className="font-semibold">Review</h3>
      {result.questions.map((q, i) => (
        <Card key={q._id || i} className={`border-l-4 p-5 ${q.correct ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
          <div className="flex items-start gap-2">{q.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}<p className="text-sm font-medium">{i + 1}. {q.question}</p></div>
          <ul className="mt-3 space-y-1.5 text-sm">{q.options.map((o, j) => (
            <li key={j} className={`rounded-lg px-3 py-2 ${j === q.correctIndex ? 'bg-emerald-50 text-emerald-800' : j === q.selectedIndex ? 'bg-rose-50 text-rose-800' : 'text-slate-600'}`}>{'ABCD'[j]}. {o}{j === q.correctIndex && ' ✓'}{j === q.selectedIndex && j !== q.correctIndex && ' (your answer)'}</li>))}
            {q.selectedIndex === -1 && <li className="text-xs text-slate-500">You skipped this question.</li>}</ul>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{q.explanation}</p>
        </Card>))}
    </div>
  );
}
