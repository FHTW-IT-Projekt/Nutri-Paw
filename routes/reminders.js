import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

// GET: Maggys Frontend holt sich beim Laden die gespeicherten Reminder
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT pet_id AS petId, task_id AS taskId, enabled, DATE_FORMAT(remind_time, "%H:%i") AS remindTime FROM reminders');
        res.json(rows);
    } catch (error) {
        console.error('Fehler beim Laden der Reminder:', error);
        res.status(500).json({ message: 'Serverfehler' });
    }
});

// POST: Maggys Frontend speichert oder updatet einen Reminder (Upsert)
router.post('/', async (req, res) => {
    console.log("DATEN VOM FRONTEND EMPFANGEN:", req.body);
    const { petId, taskId, enabled, remindTime } = req.body;

    try {
        await pool.query(
            `INSERT INTO reminders (pet_id, task_id, enabled, remind_time) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), remind_time = VALUES(remind_time)`,
            [petId, taskId, enabled, remindTime || null]
        );
        res.status(200).json({ message: 'Reminder gespeichert' });
    } catch (error) {
        console.error('Fehler beim Speichern des Reminders:', error);
        res.status(500).json({ message: 'Serverfehler' });
    }
});

export default router;