import express from 'express';
import config from './config/config.js';
import morgan from 'morgan';
import { createLogger } from './config/logger.js';
import { jsonParserWithValidation, invalidJsonErrorHandler } from './middleware/validateJSON.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { hello } from './controllers/protected.controller.js';
import { authenticateToken } from './middleware/auth.middleware.js';

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
app.use('/api/user', userRoutes);

//Expose documenteation in dev environments:
if (config.env === 'development') {
  const swaggerUi = await import('swagger-ui-express');
  const { swaggerSpec } = await import('./config/swagger.js');

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}


//Check JWT logic
app.get('/protected', authenticateToken, hello);

export default app;