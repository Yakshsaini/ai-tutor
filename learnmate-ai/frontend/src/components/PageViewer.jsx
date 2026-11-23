import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '../api.js';
import { Spinner } from './ui.jsx';

/** Slide-over that shows the extracted text of a document page (used by citations and the documents table). */
export default function PageViewer({ docId, initialPage = 1, onClose }) {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setData(null); setError(null);
    api.docPage(docId, page).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [docId, page]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside className="flex h-full w-full max-w-lg flex-col bg-white shadow-md" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Document page">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="min-w-0"><p className="truncate font-semibold">{data?.name || 'Loading…'}</p><p className="text-xs text-slate-500">Page {page}{data ? ` of ${data.pageCount}` : ''}</p></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {error ? <p className="text-sm text-rose-600">{error}</p> : data ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.text}</p> : <Spinner className="h-6 w-6 text-indigo-600" />}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Prev</button>
          <button disabled={!data || page >= data.pageCount} onClick={() => setPage(page + 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-40">Next<ChevronRight className="h-4 w-4" /></button>
        </div>
      </aside>
    </div>
  );
}
