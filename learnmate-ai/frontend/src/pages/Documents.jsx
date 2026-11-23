import { useRef, useState } from 'react';
import { Eye, FileText, FileX, Trash2, UploadCloud } from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { fmtDate, fmtSize, useLoad } from '../hooks.js';
import { Badge, Card, Empty, ErrorState, Skeleton, Spinner } from '../components/ui.jsx';
import PageViewer from '../components/PageViewer.jsx';

export default function Documents() {
  const { data: docs, loading, error, reload } = useLoad(api.docs);
  const { toast } = useApp();
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(null); // { name, pct }
  const [viewer, setViewer] = useState(null);
  const input = useRef();

  async function handleFiles(files) {
    for (const f of files) {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { toast(`${f.name} is not a PDF.`, 'error'); continue; }
      if (f.size > 10 * 1024 * 1024) { toast(`${f.name} is larger than 10 MB.`, 'error'); continue; }
      setUploading({ name: f.name, pct: 0 });
      try { await api.upload(f, (pct) => setUploading({ name: f.name, pct })); toast(`${f.name} uploaded and indexed.`); await reload(); }
      catch (e) { toast(e.message, 'error'); }
    }
    setUploading(null);
  }

  async function remove(d) {
    if (!window.confirm(`Delete "${d.name}"? Quiz history is kept.`)) return;
    try { await api.deleteDoc(d._id); toast('Document deleted.'); reload(); } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="space-y-6">
      <div role="button" tabIndex={0} aria-label="Upload PDF" onClick={() => input.current.click()} onKeyDown={(e) => e.key === 'Enter' && input.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles([...e.dataTransfer.files]); }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200 bg-white hover:border-indigo-400'}`}>
        <input ref={input} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ''; }} />
        {uploading ? (
          <div className="mx-auto max-w-sm"><Spinner className="mx-auto mb-3 h-7 w-7 text-indigo-600" /><p className="font-medium">{uploading.pct < 100 ? `Uploading ${uploading.name}…` : 'Extracting text page by page…'}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${uploading.pct}%` }} /></div></div>
        ) : (<>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><UploadCloud className="h-7 w-7" /></div>
          <p className="font-semibold">Drag &amp; drop PDFs here, or <span className="text-indigo-600">browse</span></p>
          <p className="mt-1 text-sm text-slate-500">PDF only · max 10 MB · text-based PDFs (not scans)</p>
        </>)}
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton className="h-48" /> : (
        <Card className="overflow-hidden">
          {docs.length === 0 ? <Empty icon={FileX} title="No documents yet" text="Upload your first PDF to start learning." /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500"><tr>{['Name', 'Size', 'Uploaded', 'Pages', 'Status', 'Actions'].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{docs.map((d) => (
                <tr key={d._id}>
                  <td className="px-5 py-4 font-medium"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-rose-500" />{d.name}</span></td>
                  <td className="px-5 py-4 text-slate-600">{fmtSize(d.size)}</td><td className="px-5 py-4 text-slate-600">{fmtDate(d.uploadedAt)}</td>
                  <td className="px-5 py-4 text-slate-600">{d.pageCount}</td>
                  <td className="px-5 py-4"><Badge className="bg-emerald-50 text-emerald-700">Indexed · {d.indexedPages} pages</Badge></td>
                  <td className="px-5 py-4"><div className="flex gap-1">
                    <button onClick={() => setViewer(d._id)} className="rounded-lg p-2 hover:bg-slate-100" aria-label={`View ${d.name}`}><Eye className="h-4 w-4" /></button>
                    <button onClick={() => remove(d)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${d.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>))}</tbody>
            </table></div>
          )}
        </Card>
      )}
      {viewer && <PageViewer docId={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
