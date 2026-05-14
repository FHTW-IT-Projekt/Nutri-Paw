import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

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



export default router;