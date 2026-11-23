import { Router } from 'express';
import Document from '../models/Document.js';
import StudyPlan from '../models/StudyPlan.js';
import { asyncHandler, HttpError, requireId } from '../middleware/errors.js';
import { makePlan } from '../services/ai.js';
import { computeMastery } from '../services/analytics.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await StudyPlan.findOne().sort({ createdAt: -1 }).lean());
}));

router.post('/generate', asyncHandler(async (req, res) => {
  const days = Number(req.body?.days ?? 5);
  if (!Number.isInteger(days) || days < 3 || days > 7) throw new HttpError(400, 'Plan length must be 3-7 days.');
  const mastery = await computeMastery();
  if (!mastery.length) throw new HttpError(400, 'Take at least one practice quiz first so LearnMate can find your weak topics.', 'NO_QUIZ_HISTORY');
  const docs = await Document.find().select('name').lean();
  const result = await makePlan(mastery, docs.map((d) => d.name), days);
  const plan = await StudyPlan.create({
    summary: result.summary, days: result.days, mode: result.mode,
    weakTopics: mastery.filter((m) => m.level !== 'strong').map((m) => m.topic),
  });
  res.status(201).json(plan);
}));

router.patch('/:planId/tasks/:taskId', asyncHandler(async (req, res) => {
  requireId(req.params.planId, 'plan id'); requireId(req.params.taskId, 'task id');
  if (typeof req.body?.done !== 'boolean') throw new HttpError(400, '"done" must be true or false.');
  const plan = await StudyPlan.findById(req.params.planId);
  const task = plan?.days.map((d) => d.tasks.id(req.params.taskId)).find(Boolean);
  if (!task) throw new HttpError(404, 'Task not found.');
  task.done = req.body.done;
  await plan.save();
  res.json(plan);
}));

export default router;
