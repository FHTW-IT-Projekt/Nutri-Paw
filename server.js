// 1. ALLE IMPORTE GANZ OBEN
import express from 'express';
import cors from 'cors';

// Einbinden der "Router-Dateien" (Wichtig: immer mit .js Endung!)
import petRoutes from './routes/pet.js';
import feedingEventsRoutes from './routes/feedingEvents.js';
import registerRoutes from './routes/auth.js';
import petEditRoutes from './routes/petEdit.js';

console.log("+++ TEST: DIE RICHTIGE SERVER.JS WIRD GESTARTET +++");

// 2. APP INITIALISIEREN
const app = express();
const port = 3000;

// 3. GENERELLE MIDDLEWARE EINBINDEN
app.use(cors());
app.use(express.json()); // Wandelt Rohdaten in JS-Objekt um (req.body)

// ==========================================
// 4. SPEZIFISCHE ENDPUNKTE (Müssen VOR den Routern stehen)
// ==========================================

// MOCK-DATEN ENDPUNKT
app.get('/api/getSampleData', (req, res) => {
  const mockPet = {
    pet_id: 12,              // Die simulierte Datenbank-ID
    name: "Mira",
    species: "Hund",
    race: "Mischling",       // Entspricht 'breed' im Frontend
    age: 9.5,
    colour: "brown",         // Entspricht 'color' im Frontend
    diagnosis: "Zahnprobleme (behandelt)",
    behaviour: "Sehr aufgeweckt und frech" // Entspricht 'special_features' im Frontend
  };
  
  res.json(mockPet);
});

// ==========================================
// 5. ROUTER EINHÄNGEN (Mounting)
// ==========================================
// WICHTIG: Alle Pfade komplett kleingeschrieben, passend zum Frontend-Fetch!
app.use('/api/pets', petRoutes); 
app.use('/api/feedingevents', feedingEventsRoutes);
app.use('/api/petedit', petEditRoutes); // <-- Geändert auf 'petedit' (kleines 'e')

// Die allgemeine Route '/api' wird ZWINGEND ans Ende der Kette gesetzt.
// Sie fängt sonst alle spezifischeren /api/... Routen ab, wenn sie weiter oben steht.
app.use('/api', registerRoutes);

// 6. SERVER STARTEN
app.listen(port, () => {
    console.log(`Nutripaw app listening on port ${port}`);
});