import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import documents from './routes/documents.js';
import tutor from './routes/tutor.js';
import quiz from './routes/quiz.js';
import progress from './routes/progress.js';
import planner from './routes/planner.js';
import settings from './routes/settings.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
mongoose.set('bufferCommands', false); // fail fast (clear 503) instead of hanging when MongoDB is down

app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '100kb' }));

const aiLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many AI requests. Please wait a minute and try again.' } });
app.use(['/api/tutor', '/api/quiz/generate', '/api/planner/generate', '/api/settings/probe'], aiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/documents', documents);
app.use('/api/tutor', tutor);
app.use('/api/quiz', quiz);
app.use('/api/progress', progress);
app.use('/api/planner', planner);
app.use('/api/settings', settings);
app.use(notFound);
app.use(errorHandler);

async function connectDb() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('MongoDB connected successfully');
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    setTimeout(connectDb, 5000);
  }
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`LearnMate API running on http://localhost:${port}`);
  if (!process.env.GEMINI_API_KEY) console.warn('GEMINI_API_KEY is not set. Enable Demo Mode in Settings or add the key to backend/.env.');
  connectDb();
});
