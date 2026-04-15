const db = require('./db');

async function test() {
  const [rows] = await db.query('SHOW TABLES');
  console.log(rows);
}

test();