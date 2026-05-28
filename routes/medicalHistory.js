import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

router.get('/:petId/dashboard', async (req, res) => {
    try {
        const { petId } = req.params;

        //fetch pet data
        const [pets] = await pool.execute('SELECT * FROM pets WHERE pet_id = ?', [petId]);
        
        if (pets.length === 0) {
            return res.status(404).json({ message: 'Pet not found' });
        }
        
        const pet = pets[0];

       const ageString = pet.age ? `${pet.age} Years` : 'Unknown';

        //fetch and order weight by entry + weight change logic
        const [weightEntries] = await pool.execute(
            'SELECT weight, entry_date FROM weight_history WHERE pet_id = ? ORDER BY entry_date DESC',
            [petId]
        );

        const weight_changes = weightEntries.map((entry, index) => {
            let changeStr = '----';
            
            // If there is an older entry timewise compare against it
            if (index < weightEntries.length - 1) {
                const currentWeight = parseFloat(entry.weight);
                const previousWeight = parseFloat(weightEntries[index + 1].weight);
                const diff = currentWeight - previousWeight;
                
                // + sign for gain, - automatically
                changeStr = diff > 0 ? `+${diff.toFixed(1)}kg` : `${diff.toFixed(1)}kg`; 
            }

            // Format date to DD-MM-YYYY
            const formattedDate = new Date(entry.entry_date).toLocaleDateString('en-GB').replace(/\//g, '-');

            return {
                date: formattedDate,
                weight: `${entry.weight}kg`,
                change: changeStr
            };
        });

        const responseData = {
            name: pet.name,
            species: pet.species,
            race: pet.race,
            age: ageString,
            gender: pet.gender,
            castrated: pet.castrated === 1,
            color: pet.colour,
            weight: pet.weight ? `${pet.weight}kg` : (weight_changes[0]?.weight || '-'),
            medicine: pet.medication ? JSON.parse(pet.medication) : [],
            diagnosis: pet.diagnosis ? JSON.parse(pet.diagnosis) : [],
            dietary_restrictions: pet.dietary_restrictions ? JSON.parse(pet.dietary_restrictions) : [],
            medical_notes: pet.medical_notes ? JSON.parse(pet.medical_notes) : [],
            behavior: pet.behaviour ? JSON.parse(pet.behaviour) : [],
            weight_changes: weight_changes
        };
        
        res.status(200).json({ status: 200, data: responseData });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;