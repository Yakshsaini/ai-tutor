import { Router } from 'express';
import Document from '../models/Document.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { asyncHandler } from '../middleware/errors.js';
import { computeMastery, computeStreak } from '../services/analytics.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [totalDocs, attempts, recentDocs, mastery] = await Promise.all([
    Document.countDocuments(),
    QuizAttempt.find({ status: 'completed' }).select('-questions').sort({ completedAt: -1 }).lean(),
    Document.find().sort({ uploadedAt: -1 }).limit(6).select('name uploadedAt').lean(),
    computeMastery(),
  ]);
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const activity = [
    ...recentDocs.map((d) => ({ type: 'upload', text: `Uploaded ${d.name}`, date: d.uploadedAt })),
    ...attempts.slice(0, 6).map((a) => ({ type: 'quiz', text: `Scored ${a.score}% on ${a.documentName}`, date: a.completedAt })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  res.json({
    stats: { totalDocs, quizzesTaken: attempts.length, avgScore, streak: computeStreak(attempts.map((a) => a.completedAt)) },
    mastery, weakTopics: mastery.filter((m) => m.level === 'weak'),
    history: attempts.slice(0, 50),
    trend: attempts.slice(0, 15).reverse().map((a) => ({ date: a.completedAt, score: a.score })),
    activity,
  });
}));

export default router;
