import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Files, MessageCircle, Send, Sparkles } from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad } from '../hooks.js';
import { Card, DocSelect, Empty, ErrorState, Skeleton, Spinner, Button } from '../components/ui.jsx';
import PageViewer from '../components/PageViewer.jsx';

const LEVELS = [['beginner', 'Beginner (ELI5)'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']];
const SUGGESTIONS = ['Summarise the main ideas', 'What are the key terms?', 'Explain the most important concept'];

function Message({ m, onCite }) {
  if (m.role === 'user') return <div className="flex justify-end"><div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white">{m.content}</div></div>;
  const parts = m.content.split(/(\[Page \d+\])/g);
  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.error ? 'bg-rose-100 text-rose-600' : 'bg-purple-100 text-purple-600'}`}><Sparkles className="h-4 w-4" /></div>
      <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed ${m.error ? 'bg-rose-50 text-rose-800' : 'bg-slate-100'}`}>
        {parts.map((p, i) => { const n = /^\[Page (\d+)\]$/.exec(p)?.[1]; return n
          ? <button key={i} onClick={() => onCite(Number(n))} className="mx-0.5 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200">Page {n}</button> : <span key={i}>{p}</span>; })}
        {m.error && m.code === 'GEMINI_NOT_CONFIGURED' && <Link to="/settings" className="mt-2 block font-semibold underline">Open Settings to enable Demo Mode</Link>}
      </div>
    </div>
  );
}

export default function Tutor() {
  const { data: docs, loading, error, reload } = useLoad(api.docs);
  const { toast } = useApp();
  const [docId, setDocId] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [chats, setChats] = useState({}); // per-document history
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [cite, setCite] = useState(null);
  const end = useRef();

  useEffect(() => { if (docs?.length && !docs.some((d) => d._id === docId)) setDocId(docs[0]._id); }, [docs, docId]);
  const messages = chats[docId] || [];
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, sending]);

  const send = useCallback(async (text) => {
    const q = text.trim();
    if (q.length < 3 || sending) return;
    const history = messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setChats((c) => ({ ...c, [docId]: [...(c[docId] || []), { role: 'user', content: q }] }));
    setInput(''); setSending(true);
    try {
      const r = await api.ask({ documentId: docId, question: q, difficulty: level, history });
      setChats((c) => ({ ...c, [docId]: [...c[docId], { role: 'assistant', content: r.answer }] }));
    } catch (e) {
      setChats((c) => ({ ...c, [docId]: [...c[docId], { role: 'assistant', content: e.message, error: true, code: e.code }] }));
      toast(e.message, 'error');
    } finally { setSending(false); }
  }, [docId, level, messages, sending, toast]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <Skeleton className="h-96" />;
  if (!docs.length) return <Card><Empty icon={Files} title="Upload a document first" text="The tutor answers strictly from your own PDFs."><Link to="/documents"><Button>Go to My Documents</Button></Link></Empty></Card>;

  return (
    <Card className="flex flex-col" style={{ height: 'calc(100vh - 11rem)', minHeight: 480 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <DocSelect docs={docs} value={docId} onChange={setDocId} className="max-w-full" />
        <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Difficulty">
          {LEVELS.map(([k, label]) => <button key={k} onClick={() => setLevel(k)} aria-pressed={level === k} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${level === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && <Empty icon={MessageCircle} title="Ask anything about this document" text="Answers come only from your PDF and cite the page they came from. Try a suggestion below." />}
        {messages.map((m, i) => <Message key={i} m={m} onCite={setCite} />)}
        {sending && <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner className="h-4 w-4" />Tutor is reading your document…</div>}
        <div ref={end} />
      </div>
      <div className="border-t border-slate-100 p-4">
        {messages.length === 0 && <div className="mb-3 flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:border-indigo-300 hover:bg-indigo-50">{s}</button>)}</div>}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} aria-label="Your question" placeholder="Ask a question about your document…" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <Button type="submit" loading={sending} disabled={input.trim().length < 3}><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></Button>
        </form>
      </div>
      {cite && <PageViewer docId={docId} initialPage={cite} onClose={() => setCite(null)} />}
    </Card>
  );
}
