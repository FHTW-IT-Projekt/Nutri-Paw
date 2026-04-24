import mysql from 'mysql2';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nutripaw', 
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
});

export default pool.promise();
