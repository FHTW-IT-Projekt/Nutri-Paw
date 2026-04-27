import express from "express";
import pool from "../db/db.js";

const router = express.Router();

// Alle Tiere eines Users
router.get("/:userId/pets", async (req, res) => {
    const userId = req.params.userId;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM pets WHERE owner_id = ?",
            [userId]
        );

        res.json(rows); // Liste aller Tiere zurückgeben
    } catch (error) {
        console.error("Fehler bei der DB-Abfrage:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
});

export default router;
