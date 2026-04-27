
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


app.use(apiPrefix + 'pets', petRoutes);

app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});
