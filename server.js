
import express from 'express';
import cors from 'cors';
//einbinden der "Router-Dateien"
import petRoutes from './routes/pet.js';

const app = express();
const port = 3000;

const apiPrefix = '/api/'; // nur zur Trennung für frontend und Backend, damit klar ist, hier sind nur datenpackete und keine webpage zu erwarten

app.use(cors());
app.use(express.json()); // damit frontend daten an backedn sende kann
// wandelt rohdaten in java script objekt um und speichert fsd objrkt in req.body 


<<<<<<< Updated upstream
app.use(apiPrefix + 'pets', petRoutes);
=======
const feedingEventsRoutes = require('./routes/feedingEvents');
app.use('/api/feeding-events', feedingEventsRoutes);

const registerRoutes = require('./routes/auth');
app.use('/api', registerRoutes);

app.get(apiPrefix + 'getSampleData', (req, res) => {
  const respone = {
    id: 5,
    name: 'Test Response',
    description: 'Go Team NutriPaw',
  }
  res.json(respone)
})
>>>>>>> Stashed changes

app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});
