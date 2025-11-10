import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_APP_USER || 'meshplay_app',
    password: process.env.DB_APP_PASSWORD || 'apppassword',
    database: process.env.DB_NAME || 'MeshPlay-LabDB',
    connectionLimit: 10, // number of simultaneous connections
});

async function getConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    return conn;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

export { pool, getConnection };