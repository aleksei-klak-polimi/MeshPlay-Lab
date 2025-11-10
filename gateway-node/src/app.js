import express from 'express';
import config from './config/config.js';
import morgan from 'morgan';
import { createLogger } from './config/logger.js';
import dotenv from 'dotenv';
import { jsonParserWithValidation, invalidJsonErrorHandler } from './middleware/validateJSON.js';

import authRoutes from './routes/auth.routes.js';
import { hello } from './controllers/protected.controller.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const logger = createLogger('app');
const app = express();

// JSON body parsing
app.use(jsonParserWithValidation); // replaces app.use(express.json())
app.use(invalidJsonErrorHandler);

// HTTP request logging (Morgan)
if (config.env === 'development') {
  // Detailed dev format
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  // Short format in production
  app.use(morgan('combined', { stream: logger.stream }));
}

// Basic health check route
app.get('/', (req, res) => {
  logger.debug('Health check called');
  res.send('Server is running!');
});

// API routes
app.use('/api/auth', authRoutes);

//Check JWT logic
app.get('/protected', authenticateToken, hello);

export default app;