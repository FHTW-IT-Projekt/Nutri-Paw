import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

// Alle Pets eines Users - MUSS vor /:id stehen
router.get('/', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM pets WHERE owner_id = ?',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Fehler bei der Datenbank Abfrage:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

router.get('/:id', async( req, res) =>{
  const petId = req.params.id;

  try{

    const[rows] = await pool.query('SELECT * FROM pets WHERE pet_id = ?', [petId]);
    
    if(rows.length === 0){
    return res.status(404).json({ message: 'Pet not found!'});
  }
  res.json(rows[0]); // tier an frontend senden
}catch (error){

  console.error("Fehler bei der Datenbank Abfrage: ", error);
  res.status(500).json({ message: 'Interner Serverfehler'});
}
});
//add Pets Button
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

export default router;