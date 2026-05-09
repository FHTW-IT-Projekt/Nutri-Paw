import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// POST /api/feeding-events
router.post('/', async (req, res) => {
    const { pet_id, task_id, schedule_time } = req.body;
    if (!pet_id) return res.status(400).json({ error: 'pet_id required' });

    try {
        const [result] = await db.execute(
            'INSERT INTO feeding_events (pet_id, task_id, schedule_time) VALUES (?, ?, ?)',
            [pet_id, task_id || null, schedule_time || null]
        );
        res.status(201).json({ event_id: result.insertId, pet_id, task_id, schedule_time, fed_at: new Date() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/feeding-events/today/:petId
router.get('/today/:petId', async (req, res) => {
    const { petId } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM feeding_events WHERE pet_id = ? AND DATE(fed_at) = CURDATE()',
            [petId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/feeding-events (uncheck)
router.delete('/', async (req, res) => {
    const { pet_id, task_id, schedule_time } = req.body;
    if (!pet_id) return res.status(400).json({ error: 'pet_id required' });

    try {
        await db.execute(
            'DELETE FROM feeding_events WHERE pet_id = ? AND task_id = ? AND schedule_time = ? AND DATE(fed_at) = CURDATE()',
            [pet_id, task_id || null, schedule_time || null]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
