import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../config';
import apiV1Router from '../routes';
import healthRoutes from '../routes/health.routes';
import { requestLogger } from '../middleware/requestLogger';
import { errorHandler } from '../middleware/errorHandler';
import { NotFoundError } from '../utils/errors';

export const createApp = (): Express => {
  const app = express();

  // Trust proxy for Nginx reverse proxy setup (Rule 2)
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allows React frontend SPA inline styles/scripts
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS Configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  }));

  // Body Parsing
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Structured Request Logging (Rule 22)
  app.use(requestLogger);

  // Unauthenticated Health & Readiness routes at root (Rule 21)
  app.use('/', healthRoutes);

  // Modular REST API v1 (Rule 11)
  app.use('/api/v1', apiV1Router);

  // 404 Not Found Handler for unmatched routes
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler (Rule 12 & 13)
  app.use(errorHandler);

  return app;
};
