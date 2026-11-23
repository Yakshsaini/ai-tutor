import { Router } from 'express';
import Document from '../models/Document.js';
import { asyncHandler, HttpError, requireId } from '../middleware/errors.js';
import { tutorAnswer } from '../services/ai.js';

const router = Router();
const LEVELS = ['beginner', 'intermediate', 'advanced'];

router.post('/ask', asyncHandler(async (req, res) => {
  const { documentId, question, difficulty = 'intermediate', history = [] } = req.body || {};
  requireId(documentId, 'document id');
  if (typeof question !== 'string' || question.trim().length < 3 || question.length > 1000) throw new HttpError(400, 'Question must be 3-1000 characters.');
  if (!LEVELS.includes(difficulty)) throw new HttpError(400, 'Invalid difficulty level.');
  const doc = await Document.findById(documentId).select('+chunks').lean();
  if (!doc) throw new HttpError(404, 'Document not found. It may have been deleted.');
  const safeHistory = (Array.isArray(history) ? history : []).slice(-6)
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  res.json({ ...(await tutorAnswer(doc, question.trim(), difficulty, safeHistory)), difficulty });
}));

export default router;
