import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const requireId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid ${label}.`);
  return id;
};

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is too large. The maximum size is 10 MB.' });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message });
  if (mongoose.connection.readyState !== 1 && (err.name?.startsWith('Mongo') || err.name === 'MongooseError')) {
    return res.status(503).json({ error: 'Database is unavailable. Start MongoDB and check MONGODB_URI.', code: 'DB_UNAVAILABLE' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.code ? 'Something went wrong on the server.' : err.message, code: err.code });
}
