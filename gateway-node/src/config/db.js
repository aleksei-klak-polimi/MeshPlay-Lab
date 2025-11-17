import mariadb from 'mariadb';

/**
 * MariaDB connection pool instance.
 *
 * Manages a pool of database connections to reduce overhead and improve
 * performance under concurrent load. Connections should always be released
 * after use (via `conn.release()` or `conn.end()`).
 *
 * @type {mariadb.Pool}
 */
const pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_APP_USER || 'meshplay_dev',
    password: process.env.DB_APP_PASSWORD || 'devpassword',
    database: process.env.DB_NAME || 'MeshPlay-LabDB_DEV',
    connectionLimit: 10, // number of simultaneous connections
});

/**
 * Retrieves a MariaDB connection from the pool.
 *
 * This function abstracts away the pool access logic and ensures consistent
 * error handling for database connection failures. Returned connections
 * must be manually released by the caller.
 *
 * @async
 * @returns {Promise<mariadb.PoolConnection>} A live database connection.
 *
 * @throws {Error} If acquiring a connection fails.
 */
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