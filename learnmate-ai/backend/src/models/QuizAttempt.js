import mongoose from 'mongoose';

const question = new mongoose.Schema({
  topic: String,
  question: String,
  options: [String],
  correctIndex: Number,
  explanation: String,
  selectedIndex: { type: Number, default: -1 },
  correct: { type: Boolean, default: false },
});

const schema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  documentName: String,
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  mode: { type: String, enum: ['live', 'demo'], default: 'live' },
  questions: [question],
  total: Number,
  correctCount: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // percent
  timeLimitSec: Number,
  durationSec: Number,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

export default mongoose.model('QuizAttempt', schema);
