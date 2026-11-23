import { Router } from 'express';
import Document from '../models/Document.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { asyncHandler, HttpError, requireId } from '../middleware/errors.js';
import { makeQuiz } from '../services/ai.js';
import { computeMastery } from '../services/analytics.js';

const router = Router();

router.post('/generate', asyncHandler(async (req, res) => {
  const { documentId } = req.body || {};
  const count = Number(req.body?.count);
  requireId(documentId, 'document id');
  if (!Number.isInteger(count) || count < 5 || count > 10) throw new HttpError(400, 'Question count must be between 5 and 10.');
  const doc = await Document.findById(documentId).select('+chunks').lean();
  if (!doc) throw new HttpError(404, 'Document not found.');
  const weak = (await computeMastery()).filter((m) => m.level === 'weak').map((m) => m.topic);
  const { questions, mode } = await makeQuiz(doc, count, weak);
  const attempt = await QuizAttempt.create({
    document: doc._id, documentName: doc.name, mode, questions, total: questions.length, timeLimitSec: questions.length * 60,
  });
  // correct answers stay on the server until the quiz is submitted
  res.status(201).json({
    attemptId: attempt._id, documentName: doc.name, mode, timeLimitSec: attempt.timeLimitSec,
    questions: attempt.questions.map((q) => ({ topic: q.topic, question: q.question, options: q.options })),
  });
}));

router.post('/:id/submit', asyncHandler(async (req, res) => {
  requireId(req.params.id, 'quiz id');
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) throw new HttpError(404, 'Quiz not found.');
  if (attempt.status === 'completed') throw new HttpError(409, 'This quiz was already submitted.');
  const { answers, durationSec } = req.body || {};
  if (!Array.isArray(answers) || answers.length !== attempt.questions.length || !answers.every((a) => Number.isInteger(a) && a >= -1 && a <= 3)) {
    throw new HttpError(400, 'Answers must be an array with one entry (0-3, or -1 for skipped) per question.');
  }
  attempt.questions.forEach((q, i) => { q.selectedIndex = answers[i]; q.correct = answers[i] === q.correctIndex; });
  attempt.correctCount = attempt.questions.filter((q) => q.correct).length;
  attempt.score = Math.round((attempt.correctCount / attempt.total) * 100);
  attempt.durationSec = Math.min(Math.max(Number(durationSec) || 0, 0), attempt.timeLimitSec + 5);
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  await attempt.save();
  res.json(attempt);
}));

router.get('/attempts/:id', asyncHandler(async (req, res) => {
  requireId(req.params.id, 'quiz id');
  const a = await QuizAttempt.findOne({ _id: req.params.id, status: 'completed' }).lean();
  if (!a) throw new HttpError(404, 'Quiz attempt not found.');
  res.json(a);
}));

export default router;
