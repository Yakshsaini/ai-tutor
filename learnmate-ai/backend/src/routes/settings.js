import { Router } from 'express';
import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { geminiConfigured, modelName, probeGemini } from '../services/ai.js';

const router = Router();
const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

async function status() {
  const dbOk = mongoose.connection.readyState === 1;
  const demoMode = dbOk ? (await Settings.get()).demoMode : false;
  const configured = geminiConfigured();
  const effectiveMode = demoMode ? 'demo' : configured ? 'live' : 'unavailable';
  return {
    server: { ok: true, uptimeSec: Math.round(process.uptime()) },
    database: { ok: dbOk, state: DB_STATES[mongoose.connection.readyState] || 'unknown' },
    gemini: { configured, model: modelName() },
    demoMode, effectiveMode,
    warning: effectiveMode === 'unavailable'
      ? 'GEMINI_API_KEY is missing. Add it to backend/.env and restart the server, or turn on Demo Mode to keep going without Gemini.'
      : null,
  };
}

router.get('/status', asyncHandler(async (req, res) => res.json(await status())));
router.post('/probe', asyncHandler(async (req, res) => res.json(await probeGemini())));
router.put('/', asyncHandler(async (req, res) => {
  if (typeof req.body?.demoMode !== 'boolean') throw new HttpError(400, '"demoMode" must be true or false.');
  await Settings.findOneAndUpdate({ key: 'app' }, { demoMode: req.body.demoMode }, { upsert: true });
  res.json(await status());
}));

export default router;
