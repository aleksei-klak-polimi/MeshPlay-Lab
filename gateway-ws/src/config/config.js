/**
 * Global configuration values for the WebSocket gateway service.
 *
 * This module centralizes environment-dependent settings such as the runtime
 * environment, server port, and Redis key prefix. All values fall back to
 * development-friendly defaults when the corresponding environment variables
 * are not provided.
 *
 * This config object should be imported wherever these settings are required.
 *
 * @property {number|string} port - Port number the gateway server listens on.
 * @property {string} env - Current runtime environment ( 'development' | 'production' | 'test' ).
 * @property {string} redisPrefix - String prefix applied to all Redis channels for namespacing.
 */
const config = {
  port: process.env.PORT || 5001,
  env: process.env.NODE_ENV || 'development',
  redisPrefix: process.env.REDIS_PREFIX || 'development',
};

if (config.env === 'production' && process.env.npm_lifecycle_event === 'dev') {
  console.warn('[WARNING] NODE_ENV=production but running with "npm run dev"');
}
else if (config.env === 'development' && process.env.npm_lifecycle_event === 'start') {
  console.warn('[WARNING] NODE_ENV=development but running with "npm start"');
}

export default config;