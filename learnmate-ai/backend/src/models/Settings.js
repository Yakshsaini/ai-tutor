import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  key: { type: String, default: 'app', unique: true },
  demoMode: { type: Boolean, default: false },
});

schema.statics.get = async function () {
  return this.findOneAndUpdate({ key: 'app' }, { $setOnInsert: { key: 'app' } }, { upsert: true, new: true });
};

export default mongoose.model('Settings', schema);
