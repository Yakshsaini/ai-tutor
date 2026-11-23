import QuizAttempt from '../models/QuizAttempt.js';

export const levelOf = (p) => (p < 60 ? 'weak' : p <= 80 ? 'developing' : 'strong');

export async function computeMastery() {
  const rows = await QuizAttempt.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$questions' },
    { $group: { _id: '$questions.topic', correct: { $sum: { $cond: ['$questions.correct', 1, 0] } }, total: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => {
    const percent = Math.round((r.correct / r.total) * 100);
    return { topic: r._id, correct: r.correct, total: r.total, percent, level: levelOf(percent) };
  });
}

export function computeStreak(dates) {
  const key = (d) => d.toISOString().slice(0, 10);
  const days = new Set(dates.map((d) => key(new Date(d))));
  const cur = new Date();
  if (!days.has(key(cur))) cur.setUTCDate(cur.getUTCDate() - 1);
  let streak = 0;
  while (days.has(key(cur))) { streak += 1; cur.setUTCDate(cur.getUTCDate() - 1); }
  return streak;
}
