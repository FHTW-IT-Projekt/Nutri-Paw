import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  
  const { 
    name, species, breed, age, color, gender, weight, 
    diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes 
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO pets (
        name, species, race, age, colour, gender, weight, 
        diagnosis, medication, behaviour, dietary_restrictions, medical_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, species, breed, age, color, gender, weight, 
        diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes
      ]
    );

    res.status(201).json({ 
      message: 'Tier erfolgreich angelegt!',
      newPetId: result.insertId 
    });
  } catch (error) {
    console.error("SQL Fehler beim Erstellen im Backend:", error);
    res.status(500).json({ message: 'Serverfehler beim Anlegen des Tieres' });
  }
});



router.put('/:id', async (req, res) => {
  const petId = req.params.id;
  
  
  const { 
    name, species, breed, age, color, gender, weight, 
    diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes 
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE pets SET 
        name = ?, species = ?, race = ?, age = ?, colour = ?, gender = ?, weight = ?, 
        diagnosis = ?, medication = ?, behaviour = ?, dietary_restrictions = ?, medical_notes = ? 
      WHERE pet_id = ?`,
      [
        name, species, breed, age, color, gender, weight, 
        diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes, 
        petId
      ]
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