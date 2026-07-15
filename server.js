import 'dotenv/config';
import express from 'express';
import cors from 'cors';
//einbinden der "Router-Dateien"
import petRoutes from './routes/pet.js';
import userPetsRouter from "./routes/user.js";
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

// --- ALLE IMPORTE GANZ OBEN ---
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pet.js';
import feedingEventsRoutes from './routes/feedingEvents.js';
import petEditRoutes from './routes/petEdit.js';
import petAccessRoutes from './routes/petAccess.js';
import userRoutes from './routes/users.js';
import { sendReminderEmail } from './utils/mailer.js';
import reminderRoutes from './routes/reminders.js';
import pool from './db/db.js';
import medicalHistoryRoutes from './routes/medicalHistory.js';
import userDashboardRoutes from './routes/userDashboard.js';
import petUploadsRoutes from './routes/petUploads.js';


const app = express();
const port = process.env.PORT || 3000;

// 2. GENERELLE MIDDLEWARE
//app.use(cors());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],

}));

app.options(/.*/, cors());

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500';

/*app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});ich kommentiere es heraus damit das login funktioniert*/
//Login 


//3. SPEZIFISCHE ENDPUNKTE (Zwingend VOR den Routern) 
app.get('/api/getSampleData', (req, res) => {
    const mockPet = {
        pet_id: 1, // Reale ID aus deiner DB
        name: "Mira",
        species: "Hund",
        race: "Mischling",
        age: 9.5,
        colour: "brown",
        diagnosis: "Zahnprobleme (behandelt)",
        behaviour: "Sehr aufgeweckt und frech"
    };
    res.json(mockPet);
});

// 4. ROUTER EINHÄNGEN
app.use('/api/auth', authRoutes);
app.use("/api/users", userPetsRouter); 
app.use('/api/users', userRoutes);
app.use('/api/feeding-events', feedingEventsRoutes);
app.use('/api/pets/:petId/uploads', petUploadsRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/petedit', petAccessRoutes);
app.use('/api/petedit', petEditRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/user-dashboard', userDashboardRoutes);


// Cronjob: Läuft z.B. jede Minute zum Testen ('* * * * *')
// Später kannst du es auf z.B. stündlich ('0 * * * *') ändern
cron.schedule('* * * * *', async () => {
    console.log('⏰ Prüfe auf fällige Reminder (minütlich)...');
    
    try {
        // Die Datenbank sucht: 
        // 1. Welche Reminder sind aktiv (enabled = 1)?
        // 2. Passt die gespeicherte remind_time exakt zur aktuellen Uhrzeit (Stunde:Minute)?
      const [dueReminders] = await pool.query(`
            SELECT 
                users.email, 
                CONCAT(users.first_name, ' ', users.last_name) AS name,
                pets.name AS petName, 
                reminders.task_id 
            FROM reminders
            JOIN pets ON reminders.pet_id = pets.pet_id
            JOIN users ON pets.owner_id = users.user_id
            WHERE reminders.enabled = 1 
            AND users.reminder_active = 1
            AND DATE_FORMAT(reminders.remind_time, '%H:%i') = DATE_FORMAT(CURRENT_TIME, '%H:%i')
        `);

        // Wenn er niemanden findet, macht er nichts.
        if (dueReminders.length === 0) {
            console.log('Keine Mails für diese Minute fällig.');
            return;
        }

        // Wenn er fällige Aufgaben findet, schickt er die Mails raus
        for (const task of dueReminders) {
            await sendReminderEmail(
                task.email, // Empfänger (aus der DB)
                `NutriPaw: Zeit für ${task.petName}!`, // Betreff
                `Hallo ${task.first_name || 'Nutzer'},\n\nes ist Zeit für die Aufgabe: ${task.task_id} für dein Tier ${task.petName}.\n\nLiebe Grüße,\nDein NutriPaw Team` // Text
            );
        }

    } catch (error) {
        console.error('❌ Fehler im Cronjob:', error);
    }
});

app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});