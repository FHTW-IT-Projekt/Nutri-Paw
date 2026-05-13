import express from "express";
const router = express.Router();
import pool from "../db/db.js";

//import dummyData from "../dummy_data/pet.json" assert { type: "json" };


router.get("/:userId/pets", async (req, res) => {
    const userId = req.params.userId;

    try {
        // Versuch: echte Datenbank-Abfrage
        const [rows] = await pool.query(
            "SELECT * FROM pets WHERE owner_id = ?",
            [userId]
        );

        // Wenn DB läuft und Daten liefert → transformieren
        const myPets = rows.map((p) => ({
            petId: p.pet_id,
            name: p.name,
            species: p.species,
            age: `${p.age} years`,
            weight: p.weight || "unknown",
            imageUrl: "/img/default.png",

            tasks: [
                {
                    taskId: 1,
                    name: "Food",
                    frequency: "Daily",
                    schedule: ["08:00", "18:00"],
                    lastCompletedTime: new Date().toISOString()
                }
            ],

            access: [
                { username: "Lola", role: "Parent" }
            ]
        }));

        return res.json({
            myPets,
            petsitting: []
        });

    } catch (error) {
        console.error("DB nicht erreichbar → Testdaten werden verwendet:", error);

        // Fallback: Testdaten, wenn DB nicht läuft
        const fallbackPets = [
            {
                petId: 1,
                name: "Nao",
                species: "Cat",
                age: "7 years",
                weight: "unknown",
                imageUrl: "/img/default.png",
                tasks: [
                    {
                        taskId: 1,
                        name: "Food",
                        frequency: "Daily",
                        schedule: ["08:00", "18:00"],
                        lastCompletedTime: new Date().toISOString()
                    }
                ],
                access: [
                    { username: "Lola", role: "Parent" }
                ]
            }
        ];

        return res.json({
            myPets: fallbackPets,
            petsitting: []
        });
    }
});
router.get("/:userId/sitting", async (req, res) => {
    res.json([]);
});

export default router;


