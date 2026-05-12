import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import feedingEventsRoutes from './routes/feedingEvents.js';
import authRoutes from './routes/auth.js';

const app = express();
const port = process.env.PORT || 3000;

const apiPrefix = '/api/';

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use('/api/feeding-events', feedingEventsRoutes);
app.use('/api/auth', authRoutes);

app.get(apiPrefix + 'getSampleData', (req, res) => {
  const response = {
    id: 5,
    name: 'Test Response',
    description: 'Go Team NutriPaw',
  };
  res.json(response);
});

app.listen(port, () => {
  console.log(`Nutripaw app listening on port ${port}`);
});
