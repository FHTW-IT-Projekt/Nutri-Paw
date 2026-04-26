const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/pets — alle Haustiere (für Dropdown)
router.get('/pets', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT pet_id, name, species FROM pets ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// GET /api/pets/:petId/medications — Medikamente eines Tieres
router.get('/pets/:petId/medications', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT medication_id, medication_name, dosage FROM medications WHERE pet_id = ? AND (end_date IS NULL OR end_date >= CURDATE())',
            [req.params.petId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// POST /api/food-entries — neuen Fütterungseintrag speichern
router.post('/food-entries', async (req, res) => {
    const { pet_id, food_type, amount, food_time, entry_date } = req.body;
    if (!pet_id || !food_type || !amount || !food_time || !entry_date) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }
    try {
        await db.query(
            'INSERT INTO food_entries (pet_id, food_type, amount, food_time, entry_date) VALUES (?, ?, ?, ?, ?)',
            [pet_id, food_type, amount, food_time, entry_date]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// GET /api/food-entries — alle Einträge mit Tiernamen
router.get('/food-entries', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.food_entry_id, p.name AS pet_name, f.food_type, f.amount,
                   TIME_FORMAT(f.food_time, '%H:%i') AS food_time,
                   DATE_FORMAT(f.entry_date, '%d.%m.%Y') AS entry_date
            FROM food_entries f
            JOIN pets p ON f.pet_id = p.pet_id
            ORDER BY f.entry_date DESC, f.food_time DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// POST /api/medication-logs — Medikamentengabe eintragen
router.post('/medication-logs', async (req, res) => {
    const { medication_id, pet_id, given_at, notes } = req.body;
    if (!medication_id || !pet_id || !given_at) {
        return res.status(400).json({ error: 'Fehlende Felder' });
    }
    try {
        await db.query(
            'INSERT INTO medication_logs (medication_id, pet_id, given_at, notes) VALUES (?, ?, ?, ?)',
            [medication_id, pet_id, given_at, notes || null]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// GET /api/medication-logs — alle Medikamenteneinträge mit Namen
router.get('/medication-logs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ml.log_id, p.name AS pet_name, m.medication_name, m.dosage,
                   ml.given_at, ml.notes
            FROM medication_logs ml
            JOIN pets p ON ml.pet_id = p.pet_id
            JOIN medications m ON ml.medication_id = m.medication_id
            ORDER BY ml.given_at DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
