
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import petRoutes from './routes/pet.js';
import authRoutes from './routes/auth.js';
import feedingEventRoutes from './routes/feedingEvents.js';

const app = express();
const port = process.env.PORT || 3000;

const apiPrefix = '/api/';
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500,http://localhost:5500')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(cookieParser()); //für die Cookies
app.use(express.json());

app.use(apiPrefix + 'pets', petRoutes);
app.use(apiPrefix + 'auth', authRoutes);
app.use(apiPrefix + 'feeding-events', feedingEventRoutes);

app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});