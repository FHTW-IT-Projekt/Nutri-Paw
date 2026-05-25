import express from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import pool from '../db/db.js';

const router = express.Router({ mergeParams: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/pet-documents';
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.petId}-${Date.now()}${ext}`);
  }
});

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf'
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    ALLOWED_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only images (JPG, PNG, GIF, WEBP) and PDF files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// GET /api/pets/:petId/uploads
router.get('/', async (req, res) => {
  const { petId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT upload_id, filename, file_url, mime_type, note, uploaded_at
       FROM pet_uploads
       WHERE pet_id = ?
       ORDER BY uploaded_at DESC`,
      [petId]
    );
    res.json({ uploads: rows });
  } catch (error) {
    console.error('[GET /api/pets/:petId/uploads]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/pets/:petId/uploads
router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { petId } = req.params;
    const note     = req.body.note?.trim() || null;
    const fileUrl  = `/uploads/pet-documents/${req.file.filename}`;

    try {
      const [petCheck] = await pool.query(
        'SELECT pet_id FROM pets WHERE pet_id = ?',
        [petId]
      );
      if (petCheck.length === 0) {
        unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Pet not found' });
      }

      const [result] = await pool.query(
        `INSERT INTO pet_uploads (pet_id, filename, file_url, mime_type, note)
         VALUES (?, ?, ?, ?, ?)`,
        [petId, req.file.originalname, fileUrl, req.file.mimetype, note]
      );

      res.status(201).json({
        upload_id:   result.insertId,
        filename:    req.file.originalname,
        file_url:    fileUrl,
        mime_type:   req.file.mimetype,
        note,
        uploaded_at: new Date().toISOString()
      });
    } catch (error) {
      if (existsSync(req.file.path)) unlinkSync(req.file.path);
      console.error('[POST /api/pets/:petId/uploads]', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
});

export default router;
