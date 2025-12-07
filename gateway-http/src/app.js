import express from 'express';
import config from './config/config.js';
import morgan from 'morgan';
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { jsonParserWithValidation, invalidJsonErrorHandler } from './middleware/validateJSON.middleware.js';
import { signRequest } from './middleware/requestSignature.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const logger = createLogger('app');
const app = express();

//Add timestamp and id to request
app.use(signRequest);

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

export default app;