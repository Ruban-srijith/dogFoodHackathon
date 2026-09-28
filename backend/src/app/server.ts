import { createApp } from './app';
import { config } from '../config';
import { db } from '../config/database';
import { logger } from '../utils/logger';

const startServer = async () => {
  const app = createApp();

  logger.info('Connecting to PostgreSQL database...', {
    host: config.db.host,
    port: config.db.port,
    db: config.db.name,
  });

  const isHealthy = await db.checkHealth();
  if (!isHealthy) {
    logger.warn('Initial PostgreSQL ping failed. Database may still be initializing or starting in Docker.');
  } else {
    logger.info('PostgreSQL connected successfully.');
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`DOGFOOD Backend server running on port ${config.port}`, {
      env: config.env,
      port: config.port,
    });
  });

  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
