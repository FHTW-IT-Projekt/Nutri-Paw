require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('DB Fehler:', err);
    return;
  }
  console.log('Datenbank verbunden');
});

const apiPrefix = '/api/';

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
