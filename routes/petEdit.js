import express from 'express';
import pool from '../db/db.js';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';

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
  const token = req.cookies.nutripaw_token;

  if(!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner_id = decoded.userId;

    if(!owner_id){
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  const { 
    name, species, breed, age, color, gender, weight, 
    diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes 
  } = req.body;


  
    const [result] = await pool.query(
      `INSERT INTO pets (
      owner_id, name, species, race, age, colour, gender, weight, 
        diagnosis, medication, behaviour, dietary_restrictions, medical_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_id, name, species, breed, age, color, gender, weight, 
        diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes
      ]
    );

    res.status(201).json({ 
      message: 'Tier erfolgreich angelegt!',
      newPetId: result.insertId 
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token ungültig oder abgelaufen.' });
    }
    
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

  
    //changes for medication handling
    const medSource = req.body.medication_data ? req.body.medication_data : req.body;
  
    const { 
      medication_name, 
      medication_type, 
      dosage, 
      start_date, 
      end_date, 
      times, 
      week_days 
    } = medSource;

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

    //changes for medication handling
if (medication_name && start_date) {
      // Macht aus dem Array ["08:00", "20:00"] einen sauberen String "08:00,20:00"
      const timeString = Array.isArray(times) ? times.join(',') : '08:00';
      
      // Nutzt das übergebene week_days (entweder "all" oder z.B. "1,4")
      const daysString = week_days || 'all';

      const finalEndDate = end_date && end_date.trim() !== '' ? end_date : null;

      await pool.query(
        `INSERT INTO medications (pet_id, medication_name, medication_type, dosage, start_date, end_date, schedule_times, week_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [petId, medication_name, medication_type, dosage, start_date, finalEndDate, timeString, daysString]
      );

           console.log("Medikament erfolgreich für Pet " + petId + " gespeichert!");
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