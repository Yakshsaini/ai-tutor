import { Router } from 'express';
import Document from '../models/Document.js';
import { upload, safeName } from '../middleware/upload.js';
import { asyncHandler, HttpError, requireId } from '../middleware/errors.js';
import { extractPages } from '../services/pdf.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Document.find().sort({ uploadedAt: -1 }).lean());
}));

router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose a PDF file to upload.');
  if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw new HttpError(415, 'This file is not a valid PDF.');
  let result;
  try { result = await extractPages(req.file.buffer); }
  catch { throw new HttpError(422, 'Could not read this PDF. It may be corrupted or password-protected.'); }
  if (!result.pages.length) throw new HttpError(422, 'No selectable text found. Scanned PDFs need OCR first.');
  const doc = await Document.create({
    name: safeName(req.file.originalname), size: req.file.size, pageCount: result.numpages,
    indexedPages: result.pages.length, charCount: result.pages.reduce((s, p) => s + p.text.length, 0), chunks: result.pages,
  });
  const { chunks, ...meta } = doc.toObject();
  res.status(201).json(meta);
}));

router.get('/:id/pages/:n', asyncHandler(async (req, res) => {
  requireId(req.params.id, 'document id');
  const doc = await Document.findById(req.params.id).select('+chunks').lean();
  if (!doc) throw new HttpError(404, 'Document not found.');
  const n = Number(req.params.n);
  const chunk = doc.chunks.find((c) => c.page === n);
  res.json({ name: doc.name, page: n, pageCount: doc.pageCount, text: chunk ? chunk.text : '(No extractable text on this page.)' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  requireId(req.params.id, 'document id');
  const doc = await Document.findByIdAndDelete(req.params.id);
  if (!doc) throw new HttpError(404, 'Document not found.');
  res.json({ ok: true });
}));

export default router;
