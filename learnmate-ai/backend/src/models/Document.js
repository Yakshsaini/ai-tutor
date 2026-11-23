import mongoose from 'mongoose';

const chunk = new mongoose.Schema({ page: Number, text: String }, { _id: false });

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  size: { type: Number, required: true },
  pageCount: { type: Number, required: true },
  indexedPages: Number,
  charCount: Number,
  chunks: { type: [chunk], select: false }, // page-by-page text, kept out of list queries
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Document', schema);
