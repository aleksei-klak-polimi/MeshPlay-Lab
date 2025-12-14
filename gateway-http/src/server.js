import loadEnv from '@meshplaylab/shared/src/utils/loadEnv.js';

// Load env file
loadEnv();

const { default: app } = await import('./app.js');
const { createLogger } = await import('@meshplaylab/shared/src/config/logger.js');
const { default: config } = await import('./config/config.js');

const PORT = config.port;
const logger = createLogger('HTTP Server');

app.listen(PORT, () => logger.info(`Server listening on http://localhost:${PORT}`));