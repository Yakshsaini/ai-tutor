import multer from 'multer';
import path from 'node:path';
import { HttpError } from './errors.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(ok ? null : new HttpError(415, 'Only PDF files are allowed.'), ok);
  },
});

// Strip path parts and unsafe characters so the stored name is safe to render.
export const safeName = (n) => path.basename(n).replace(/[^\p{L}\p{N}\s._()-]/gu, '').trim().slice(0, 120) || 'document.pdf';
