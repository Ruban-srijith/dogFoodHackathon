import { Request, Response, NextFunction } from 'express';
import { RateLimitedError } from '../utils/errors';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const clientMap = new Map<string, RateLimitRecord>();

// Clean up old entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of clientMap.entries()) {
    if (now > value.resetTime) {
      clientMap.delete(key);
    }
  }
}, 60000);
cleanupInterval.unref();

export const rateLimiter = (options: { maxRequests: number; windowSeconds: number }) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // In test environment, bypass rate limiting
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;

    let record = clientMap.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      clientMap.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > options.maxRequests) {
      return next(new RateLimitedError(`Too many requests. Please try again after ${Math.ceil((record.resetTime - now) / 1000)}s`));
    }

    next();
  };
};
