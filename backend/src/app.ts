import express from 'express';
import type { Application } from 'express';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // Core middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes
  app.use('/api', apiRoutes);

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
