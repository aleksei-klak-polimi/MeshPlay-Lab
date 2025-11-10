import app from './app.js';
import { createLogger } from './config/logger.js';
import config from './config/config.js';

const PORT = config.port;
const logger = createLogger('server');

app.listen(PORT, () => logger.info(`Server listening on http://localhost:${PORT}`));