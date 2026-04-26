const express = require('express')
const app = express()
const port = 3000

const apiPrefix = '/api/';

app.use(express.json());

// CORS für lokale Entwicklung
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const foodRoutes = require('./routes/food');
const feedingRoutes = require('./routes/feeding');

app.use('/api/pets', foodRoutes);
app.use('/api', feedingRoutes);

app.get(apiPrefix + 'getSampleData', (req, res) => {
  const respone = {
    id: 5,
    name: 'Test Response',
    description: 'Go Team NutriPaw',
  }
  res.json(respone)
})

app.listen(port, () => {
  console.log(`Nutripaw app listening on port ${port}`)
})
