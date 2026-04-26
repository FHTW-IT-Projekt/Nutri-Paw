const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/pets/:petId/fed-today
// Prüft ob das Tier heute schon gefüttert wurde
router.get('/:petId/fed-today', async (req, res) => {
    const { petId } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM food_entries WHERE pet_id = ? AND entry_date = CURDATE()',
            [petId]
        );
        res.json({ fedToday: rows[0].count > 0 });
    } catch (err) {
        console.error('DB error (fed-today GET):', err);
        res.status(500).json({ error: 'DB error' });
    }
});

// POST /api/pets/:petId/fed-today
// Markiert das Tier als heute gefüttert (erstellt einen food_entry Eintrag)
router.post('/:petId/fed-today', async (req, res) => {
    const { petId } = req.params;
    try {
        const [existing] = await db.query(
            'SELECT COUNT(*) as count FROM food_entries WHERE pet_id = ? AND entry_date = CURDATE()',
            [petId]
        );
        if (existing[0].count > 0) {
            return res.json({ fedToday: true });
        }
        await db.query(
            'INSERT INTO food_entries (pet_id, food_type, amount, food_time, entry_date) VALUES (?, ?, ?, CURTIME(), CURDATE())',
            [petId, 'Fütterung', 1.00]
        );
        res.status(201).json({ fedToday: true });
    } catch (err) {
        console.error('DB error (fed-today POST):', err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
