/**
 * Global application configuration values.
 *
 * Centralizes environment-dependent settings such as runtime environment,
 * server port, JWT configuration, and DB timezone. All values default to
 * sensible development-safe fallbacks when not provided through
 * environment variables.
 *
 * This module should be imported anywhere configuration values are needed.
 *
 * @typedef {Object} AppConfig
 * @property {string} env - Current runtime environment ('development', 'production', etc.).
 * @property {number|string} port - Port number used by the HTTP server.
 * @property {string} jwtSecret - Secret key used to sign JWT tokens.
 * @property {string|number} jwtExpiration - JWT token expiration as a string ('1h') or number.
 * @property {string} dbTimezone - Database timezone configuration.
 */
const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'f84a9b7ac12297a3b7a4c4f1f3d9a85c08e6bba4c8e59cc1e8e62fa792e1784ff6c7a3f9b4a4a5f7b1a2c43a52e9f8d1', //Placeholder value, not actual jwt
    jwtExpiration: process.env.JWT_EXPIRATION || '1h',
    dbTimezone: process.env.DB_TIMEZONE || 'UTC',
  };

if (config.env === 'production' && process.env.npm_lifecycle_event === 'dev') {
  console.warn('[WARNING] NODE_ENV=production but running with "npm run dev"');
}
else if (config.env === 'development' && process.env.npm_lifecycle_event === 'start') {
  console.warn('[WARNING] NODE_ENV=development but running with "npm start"');
}

export default config;