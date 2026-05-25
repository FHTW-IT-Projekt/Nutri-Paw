import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// --- ALLE IMPORTE GANZ OBEN ---
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pet.js';
import feedingEventsRoutes from './routes/feedingEvents.js';
import petEditRoutes from './routes/petEdit.js';
import petUploadsRoutes from './routes/petUploads.js';
import userRoutes from './routes/users.js';

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
app.use('/api/users', userRoutes);
app.use('/api/feeding-events', feedingEventsRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/petedit', petEditRoutes);
app.use('/api/pets/:petId/uploads', petUploadsRoutes);


app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});