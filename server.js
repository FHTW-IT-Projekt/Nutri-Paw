require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500')
    .split(',')
    .map(o => o.trim());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const authRoutes = require('./routes/auth');
const feedingEventsRoutes = require('./routes/feedingEvents');

app.use('/api/auth', authRoutes);
app.use('/api/feeding-events', feedingEventsRoutes);

app.get('/api/getSampleData', (req, res) => {
    res.json({ id: 5, name: 'Test Response', description: 'Go Team NutriPaw' });
});

app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});
