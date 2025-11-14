import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_APP_USER || 'meshplay_dev',
    password: process.env.DB_APP_PASSWORD || 'devpassword',
    database: process.env.DB_NAME || 'MeshPlay-LabDB_DEV',
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