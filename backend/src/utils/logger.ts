export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  userId?: string;
  details?: any;
  [key: string]: any;
}

const sanitize = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'password_hash', 'jwt'];
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

export const logger = {
  info: (message: string, meta?: Partial<LogEntry>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...sanitize(meta),
    };
    console.log(JSON.stringify(entry));
  },

  warn: (message: string, meta?: Partial<LogEntry>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...sanitize(meta),
    };
    console.warn(JSON.stringify(entry));
  },

  error: (message: string, meta?: Partial<LogEntry>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...sanitize(meta),
    };
    console.error(JSON.stringify(entry));
  },

  debug: (message: string, meta?: Partial<LogEntry>) => {
    if (process.env.NODE_ENV === 'production') return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      ...sanitize(meta),
    };
    console.log(JSON.stringify(entry));
  }
};
