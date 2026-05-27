import express from 'express';
import pool from '../db/db.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
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

router.post('/:id/image', upload.single('image'), async (req, res) => {
  const petId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Kein Bild hochgeladen' });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  try {
    const [result] = await pool.query(
      'UPDATE pets SET image_url = ? WHERE pet_id = ?',
      [imagePath, petId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pet not found!' });
    }

    res.json({
      message: 'Bild erfolgreich hochgeladen',
      imageUrl: imagePath
    });
  } catch (error) {
    console.error('SQL Fehler beim Bildupload:', error);
    res.status(500).json({ message: 'Serverfehler beim Bildupload' });
  }
});

export default router;