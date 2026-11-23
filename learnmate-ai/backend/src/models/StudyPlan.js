import mongoose from 'mongoose';

const task = new mongoose.Schema({
  text: String,
  minutes: Number,
  type: { type: String, enum: ['revise', 'tutor', 'quiz'], default: 'revise' },
  done: { type: Boolean, default: false },
});
const day = new mongoose.Schema({ day: Number, title: String, tasks: [task] });

export default mongoose.model('StudyPlan', new mongoose.Schema({
  summary: String,
  weakTopics: [String],
  mode: { type: String, enum: ['live', 'demo'] },
  days: [day],
  createdAt: { type: Date, default: Date.now },
}));
