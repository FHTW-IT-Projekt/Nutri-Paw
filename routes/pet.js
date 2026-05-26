import express from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import pool from '../db/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

const petStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/pets';
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.petId}-${Date.now()}${ext}`);
  }
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const upload = multer({
  storage: petStorage,
  fileFilter: (req, file, cb) => {
    ALLOWED_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/pets?userId=:userId
router.get('/', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT pet_id, name, species, age, weight, image_url FROM pets WHERE owner_id = ?',
      [userId]
    );
    res.json(rows.map(p => ({
      petId: p.pet_id,
      name: p.name,
      species: p.species,
      age: p.age,
      weight: p.weight,
      imageUrl: p.image_url || null
    })));
  } catch (error) {
    console.error('Fehler bei der Datenbank Abfrage:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// GET /api/pets/:petId
router.get('/:petId', async (req, res) => {
  const { petId } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM pets WHERE pet_id = ?', [petId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pet not found!' });
    }

    const p = rows[0];
    res.json({
      petId: p.pet_id,
      name: p.name,
      species: p.species,
      breed: p.race,
      age: p.age,
      color: p.colour,
      gender: p.gender,
      weight: p.weight,
      imageUrl: p.image_url || null,
      ownerId: p.owner_id,
      diagnosis: p.diagnosis,
      medication: p.medication,
      behaviour: p.behaviour,
      dietaryRestrictions: p.dietary_restrictions,
      medicalNotes: p.medical_notes
    });
  } catch (error) {
    console.error('Fehler bei der Datenbank Abfrage:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// POST /api/pets
router.post('/', async (req, res) => {
  const { name, species, age, weight, userId } = req.body;

  if (!name || !species || !userId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pets (name, species, age, weight, owner_id) VALUES (?, ?, ?, ?, ?)',
      [name, species, age || null, weight || null, userId]
    );

    res.status(201).json({
      petId: result.insertId,
      name,
      species,
      age,
      weight,
      userId
    });
  } catch (error) {
    console.error('[POST /api/pets]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/pets/:petId/image
router.post('/:petId/image', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
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

    try {
      const [existing] = await pool.query(
        'SELECT pet_id, owner_id, image_url FROM pets WHERE pet_id = ?',
        [petId]
      );

      if (existing.length === 0) {
        unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Pet not found' });
      }

      if (existing[0].owner_id !== req.user.userId) {
        unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Forbidden: you are not the owner of this pet' });
      }

      const oldPath = existing[0].image_url?.replace(/^\//, '');
      if (oldPath && existsSync(oldPath)) {
        unlinkSync(oldPath);
      }

      const imageUrl = `/uploads/pets/${req.file.filename}`;

      await pool.query(
        'UPDATE pets SET image_url = ? WHERE pet_id = ?',
        [imageUrl, petId]
      );

      res.json({ imageUrl });
    } catch (error) {
      if (existsSync(req.file.path)) unlinkSync(req.file.path);
      console.error('[POST /api/pets/:petId/image]', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
});

export default router;
