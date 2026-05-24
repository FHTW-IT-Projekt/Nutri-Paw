import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, role FROM users WHERE user_id = ?',
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
    });
  } catch (error) {
    console.error('[GET /api/users/:userId]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/users/:userId
router.patch('/:userId', async (req, res) => {
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

export default router;
