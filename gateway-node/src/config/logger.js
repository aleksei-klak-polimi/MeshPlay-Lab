import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from './config.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom Winston log level definitions used by the application.
 *
 * Additional level "trace" is added for extremely verbose diagnostic output.
 *
 * @typedef {Object} CustomLogLevels
 * @property {Object<string, number>} levels - Log level names mapped to numeric severity.
 * @property {Object<string, string>} colors - ANSI colors applied to custom log levels.
 */
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

/**
 * Development log format.
 * Adds colors, timestamps, stack traces, and request contextual metadata.
 *
 * @type {winston.Logform.Format}
 */
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

/**
 * Production JSON log format optimized for log aggregation systems such as
 * Elastic, Grafana Loki, or CloudWatch.
 *
 * @type {winston.Logform.Format}
 */

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

/**
 * Base Winston logger instance used throughout the application.
 * 
 * Provides:
 * - File logging (rotating by size)
 * - Console logging
 * - Error stack capture
 * - JSON output in production
 *
 * @type {winston.Logger}
 */
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

/**
 * Writable stream interface used by HTTP loggers such as Morgan.
 * Allows Morgan to forward its logs directly into Winston.
 *
 * @type {{ write(message: string): void }}
 */
baseLogger.stream = {
  write: (message) => baseLogger.info(message.trim()),
};

/**
 * Creates a contextual logger for a specific module file.
 *
 * This allows logs to automatically include:
 * - module name
 * - method name
 * - request ID (set per incoming request)
 *
 * @param {string} moduleName - Name of the module using this logger.
 * 
 * @returns {{
 *   setRequestId(reqId: string): void,
 *   trace(message: string, method?: string): void,
 *   debug(message: string, method?: string): void,
 *   verbose(message: string, method?: string): void,
 *   info(message: string, method?: string): void,
 *   warn(message: string, method?: string): void,
 *   error(message: string, method?: string, err?: Error): void
 * }} A module-scoped logger with request-aware logging methods.
 */
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
