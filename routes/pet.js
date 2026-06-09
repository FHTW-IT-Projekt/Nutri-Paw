import express from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import pool from '../db/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

const petStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/pets';
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.petId}-${Date.now()}${ext}`);
  }
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const upload = multer({
  storage: petStorage,
  fileFilter: (req, file, cb) => {
    ALLOWED_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/pets/dashboard?userId=:userId
router.get('/dashboard', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    // get all pets the user owns OR has shared access to
    const [pets] = await pool.query(`
      SELECT DISTINCT p.* FROM pets p
      LEFT JOIN pet_access pa ON p.pet_id = pa.pet_id
      WHERE p.owner_id = ? OR pa.user_id = ?
    `, [userId, userId]);

    //build the structured UI data
    const petsArray = await Promise.all(pets.map(async (pet) => {
      
      // --- GET ACCESS ROLES ---
      // ombine the owner ("Parent") and shared users into one array
      const [accessRows] = await pool.query(`
        SELECT u.first_name as username, 'Parent' as role
        FROM users u WHERE u.user_id = ?
        UNION
        SELECT u.first_name as username, 
               CONCAT(UPPER(SUBSTRING(pa.role, 1, 1)), SUBSTRING(pa.role, 2)) as role
        FROM pet_access pa
        JOIN users u ON pa.user_id = u.user_id
        WHERE pa.pet_id = ?
      `, [pet.owner_id, pet.pet_id]);

      // --- GET FOOD TASK ---
      // fetch the last time food was given
      const [foodEvents] = await pool.query(`
        SELECT MAX(fed_at) as lastCompletedTime 
        FROM feeding_events 
        WHERE pet_id = ? AND (task_id = 'food' OR task_id IS NULL)
      `, [pet.pet_id]);

      // --- GET MEDICATION TASKS ---
      // fetch all meds and use a subquery to find the latest medication_event
      const [meds] = await pool.query(`
        SELECT m.*, 
          (SELECT MAX(medicated_at) 
           FROM medication_events me 
           WHERE me.pet_id = m.pet_id AND me.task_id = m.medication_id
          ) as lastCompletedTime
        FROM medications m
        WHERE m.pet_id = ?
      `, [pet.pet_id]);

      // --- BUILD THE TASKS ARRAY ---
      const tasks = [];
      
      //  Add Food Task
      // using a fallback schedule if you haven't added the DB column yet
      const foodSchedule = pet.food_schedule_times ? pet.food_schedule_times.split(',').map(s => s.trim()) : ['08:00', '18:00'];
      
      tasks.push({
        taskId: 'food', 
        name: 'Food',
        schedule: foodSchedule, 
        frequency: 'Daily', 
        lastCompletedTime: foodEvents[0]?.lastCompletedTime || null
      });

      // add Medication Tasks
      meds.forEach(med => {
        tasks.push({
          taskId: med.medication_id.toString(),
          name: med.medication_name,
          schedule: med.schedule_times ? med.schedule_times.split(',').map(s => s.trim()) : [],
          frequency: med.week_days === 'all' ? 'Daily' : med.week_days,
          lastCompletedTime: med.lastCompletedTime || null
        });
      });

      return {
        petId: pet.pet_id,
        name: pet.name,
        species: pet.species,
        age: pet.age,
        weight: pet.weight,
        imageUrl: pet.image_url || null,
        tasks: tasks,
        access: accessRows
      };
    }));

    res.json(petsArray);

  } catch (error) {
    console.error('Error compiling dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/pets?userId=:userId
router.get('/', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
    // select DISTINCT to avoid duplicate rows if a user somehow has multiple access records

  try {
    const [rows] = await pool.query(
  `
  SELECT DISTINCT
    p.pet_id,
    p.name,
    p.species,
    p.race,
    p.age,
    p.colour,
    p.gender,
    p.weight,
    p.diagnosis,
    p.medication,
    p.behaviour,
    p.dietary_restrictions,
    p.medical_notes,
    p.image_url
  FROM pets p
  LEFT JOIN pet_access pa ON p.pet_id = pa.pet_id
  WHERE p.owner_id = ? OR pa.user_id = ?
`,
  [userId]
);
   res.json(rows.map(p => ({
  petId: p.pet_id,
  name: p.name,
  species: p.species,
  breed: p.race,
  age: p.age,
  color: p.colour,
  gender: p.gender,
  weight: p.weight,
  diagnosis: p.diagnosis,
  medication: p.medication,
  behaviour: p.behaviour,
  dietaryRestrictions: p.dietary_restrictions,
  medicalNotes: p.medical_notes,
  imageUrl: p.image_url || null
})));


  } catch (error) {
    console.error('Fehler bei der Datenbank Abfrage:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// POST /api/pets
router.post('/', async (req, res) => {
  const { name, species, age, weight, userId } = req.body;

  if (!name || !species || !userId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pets (name, species, age, weight, owner_id) VALUES (?, ?, ?, ?, ?)',
      [name, species, age || null, weight || null, userId]
    );

    res.status(201).json({
      petId: result.insertId,
      name,
      species,
      age,
      weight,
      userId
    });
  } catch (error) {
    console.error('[POST /api/pets]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/pets/:petId
router.get('/:petId', async (req, res) => {
  const { petId } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM pets WHERE pet_id = ?', [petId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pet not found!' });
    }

    const p = rows[0];
    res.json({
      petId: p.pet_id,
      name: p.name,
      species: p.species,
      breed: p.race,
      race: p.race,
      age: p.age,
      color: p.colour,
      colour: p.colour,
      gender: p.gender,
      weight: p.weight,
      imageUrl: p.image_url || null,
      ownerId: p.owner_id,
      diagnosis: p.diagnosis,
      medication: p.medication,
      behaviour: p.behaviour,
      dietaryRestrictions: p.dietary_restrictions,
      dietary_restrictions: p.dietary_restrictions,
      medicalNotes: p.medical_notes,
      medical_notes: p.medical_notes
    });
  } catch (error) {
    console.error('Fehler bei der Datenbank Abfrage:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// POST /api/pets
router.post('/', async (req, res) => {
  const {  name,
    species,
    breed,
    race,
    age,
    color,
    colour,
    gender,
    weight,
    diagnosis,
    medication,
    behaviour,
    dietaryRestrictions,
    dietary_restrictions,
    medicalNotes,
    medical_notes,
    userId } = req.body;

    const finalBreed = breed || race || null;
  const finalColour = color || colour || null;
  const finalDietary = dietaryRestrictions || dietary_restrictions || null;
  const finalMedicalNotes = medicalNotes || medical_notes || null;

  if (!name || !species || !userId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO pets (
        name,
        species,
        race,
        age,
        colour,
        gender,
        weight,
        diagnosis,
        medication,
        behaviour,
        dietary_restrictions,
        medical_notes,
        owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name,
        species,
        finalBreed,
        age || null,
        finalColour,
        gender || null,
        weight || null,
        diagnosis || null,
        medication || null,
        behaviour || null,
        finalDietary,
        finalMedicalNotes,
        userId]
    );

    res.status(201).json({
      petId: result.insertId,
      name,
      species,
      breed: finalBreed,
      color: finalColour,
      gender,
      age,
      weight,
      diagnosis,
      medication,
      behaviour,
      dietaryRestrictions: finalDietary,
      medicalNotes: finalMedicalNotes,
      userId
    });
  } catch (error) {
    console.error('[POST /api/pets]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/pets/:petId/image
router.post('/:petId/image', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { petId } = req.params;

    try {
      const [existing] = await pool.query(
        'SELECT pet_id, owner_id, image_url FROM pets WHERE pet_id = ?',
        [petId]
      );

      if (existing.length === 0) {
        unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Pet not found' });
      }

      if (existing[0].owner_id !== req.user.userId) {
        unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Forbidden: you are not the owner of this pet' });
      }

      const oldPath = existing[0].image_url?.replace(/^\//, '');
      if (oldPath && existsSync(oldPath)) {
        unlinkSync(oldPath);
      }

      const imageUrl = `/uploads/pets/${req.file.filename}`;

      await pool.query(
        'UPDATE pets SET image_url = ? WHERE pet_id = ?',
        [imageUrl, petId]
      );

      res.json({ imageUrl });
    } catch (error) {
      if (existsSync(req.file.path)) unlinkSync(req.file.path);
      console.error('[POST /api/pets/:petId/image]', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
});

export default router;
