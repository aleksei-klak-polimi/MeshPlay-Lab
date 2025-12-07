import dotenv from 'dotenv';
dotenv.config();

const { default: app } = await import('./app.js');
const { createLogger } = await import('@meshplaylab/shared/src/config/logger.js');
const { default: config } = await import('./config/config.js');

const PORT = config.port;
const logger = createLogger('WS Server');

app.listen(PORT, () => logger.info(`Server listening on http://localhost:${PORT}`));
