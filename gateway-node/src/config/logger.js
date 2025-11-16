import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from './config.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customLevels = {
  levels: { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, trace: 6 },
  colors: { trace: 'magenta' }
};
winston.addColors(customLevels.colors);

// Ensure log directory exists
const logDir = process.env.LOG_DIR || '../logs/gateway-node';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Date-based filenames
const dateStr = new Date().toISOString();
const errorFile = path.join(logDir, `${dateStr}-error.log`);
const combinedFile = path.join(logDir, `${dateStr}-app.log`);

// Pretty console format for dev
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, module, method, requestId }) => {
    const request = requestId ? `[requestId: ${requestId}]` : '';
    const location = module ? `[${module}${method ? '.' + method : ''}]` : '';
    return `${timestamp} [${level}] ${request} ${location} ${stack || message}`;
  })
);

// JSON format for production (good for log aggregation)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const baseLogger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (config.env === 'development' ? 'debug' : 'info'),
  format: config.env === 'development' ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: errorFile, 
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB per file
      maxFiles: 10 }),
    new winston.transports.File({
      filename: combinedFile,
      maxsize: 5 * 1024 * 1024, // 5 MB per file
      maxFiles: 10 }),
  ],
});

// Allow morgan (HTTP logger) to write to Winston
baseLogger.stream = {
  write: (message) => baseLogger.info(message.trim()),
};

// Factory to create contextual loggers
export function createLogger(moduleName) {
  let requestId = null;

  return {
    setRequestId: (reqId) => { requestId = reqId },

    trace: (message, method) => baseLogger.trace(message, { module: moduleName, method, requestId }),
    debug: (message, method) => baseLogger.debug(message, { module: moduleName, method, requestId }),
    verbose: (message, method) => baseLogger.verbose(message, { module: moduleName, method, requestId }),
    info: (message, method) => baseLogger.info(message, { module: moduleName, method, requestId }),
    warn: (message, method) => baseLogger.warn(message, { module: moduleName, method, requestId }),
    error: (message, method, err) =>
      baseLogger.error(err || message, { module: moduleName, method, stack: err?.stack, requestId }),
  };
}

export default baseLogger;
