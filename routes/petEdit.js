import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

//hier das Tier geadded wenn es noch nicht existiert
router.post('/', async (req, res) => {
 // Daten vom Frontend entpacken
  const { name, species, breed, age, color, diagnosis, behaviour } = req.body;

  try {
    // Die pet_id wird von der Datenbank automatisch vergeben (Auto-Increment)
    const [result] = await pool.query(
      `INSERT INTO pets (name, species, race, age, colour, diagnosis, behaviour) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, species, breed, age, color, diagnosis, behaviour]
    );

    // result.insertId gib die ID des Tieres zurück
    res.status(201).json({ 
      message: 'Tier erfolgreich angelegt!',
      newPetId: result.insertId 
    });
  } catch (error) {
    console.error("SQL Fehler beim Erstellen im Backend:", error);
    res.status(500).json({ message: 'Serverfehler beim Anlegen des Tieres' });
  }
});


//hier passiert das update und die Routeist /api/petedit/:id
router.put('/:id', async (req, res) => {
  const petId = req.params.id;
  
 
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