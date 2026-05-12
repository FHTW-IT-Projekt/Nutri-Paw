import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

// Route: /api/petedit/:id
router.put('/:id', async (req, res) => {
  const petId = req.params.id;
  
  // Daten vom Frontend entpacken
  const { name, species, breed, age, color, diagnosis, behaviour } = req.body;

  try {
    // SQL-Befehl mit deinen echten Spaltennamen: race, colour, behaviour
    const [result] = await pool.query(
      `UPDATE pets SET name = ?, species = ?, race = ?, age = ?, colour = ?, diagnosis = ?, behaviour = ? WHERE pet_id = ?`,
      [name, species, breed, age, color, diagnosis, behaviour, petId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pet not found!' });
    }
    
    res.json({ message: 'Erfolgreich aktualisiert' });
  } catch (error) {
    console.error("SQL Fehler im Backend:", error);
    res.status(500).json({ message: 'Serverfehler beim Speichern' });
  }
});

export default router;