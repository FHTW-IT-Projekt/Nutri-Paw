import express from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import pool from '../db/db.js';

const router = express.Router();

const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/users';
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.userId}-${Date.now()}${ext}`);
  }
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const upload = multer({
  storage: userStorage,
  fileFilter: (req, file, cb) => {
    ALLOWED_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, role, image_url FROM users WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const u = rows[0];
    res.json({
      userId: u.user_id,
      firstname: u.first_name,
      lastname: u.last_name,
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      role: u.role,
      imageUrl: u.image_url || null,
    });
  } catch (error) {
    console.error('[GET /api/users/:userId]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/users/:userId
router.put('/:userId', async (req, res) => {
  console.log('PATCH reached');
  const { userId } = req.params;
  const { firstname, lastname, email, role } = req.body;

  if (!firstname?.trim()) {
    return res.status(400).json({ message: 'firstname is required' });
  }
  if (!lastname?.trim()) {
    return res.status(400).json({ message: 'lastname is required' });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'email must be valid' });
  }
  if (!['owner', 'sitter'].includes(role)) {
    return res.status(400).json({ message: 'role must be either owner or sitter' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, role = ? WHERE user_id = ?',
      [firstname.trim(), lastname.trim(), email.trim(), role, userId]
    );

    res.json({
      userId: parseInt(userId),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      name: `${firstname.trim()} ${lastname.trim()}`,
      email: email.trim(),
      role,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already in use' });
    }
    console.error('[PATCH /api/users/:userId]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users/:userId/image
router.post('/:userId/image', (req, res) => {
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

    const { userId } = req.params;
    const imageUrl = `/uploads/users/${req.file.filename}`;

    try {
      const [existing] = await pool.query(
        'SELECT image_url FROM users WHERE user_id = ?',
        [userId]
      );
      if (existing.length === 0) {
        unlinkSync(req.file.path);
        return res.status(404).json({ message: 'User not found' });
      }

      const oldPath = existing[0].image_url?.replace(/^\//, '');
      if (oldPath && existsSync(oldPath)) {
        unlinkSync(oldPath);
      }

      await pool.query(
        'UPDATE users SET image_url = ? WHERE user_id = ?',
        [imageUrl, userId]
      );

      res.json({ imageUrl });
    } catch (error) {
      if (existsSync(req.file.path)) unlinkSync(req.file.path);
      console.error('[POST /api/users/:userId/image]', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
});

export default router;
