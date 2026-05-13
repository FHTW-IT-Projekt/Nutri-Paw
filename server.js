import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import feedingEventsRoutes from './routes/feedingEvents.js';
import authRoutes from './routes/auth.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500';
console.log('CORS Origin:', FRONTEND_ORIGIN);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use('/api/feeding-events', feedingEventsRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/getSampleData', (req, res) => {
    res.json({ id: 5, name: 'Test Response', description: 'Go Team NutriPaw' });
});

app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});
