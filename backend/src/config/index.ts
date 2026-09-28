import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    url: process.env.DATABASE_URL || 'postgresql://dogfood_user:dogfood_secure_password_2026@postgres:5432/dogfood',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'dogfood',
    user: process.env.DB_USER || 'dogfood_user',
    password: process.env.DB_PASSWORD || 'dogfood_secure_password_2026',
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dogfood_super_secure_jwt_secret_key_change_in_production_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  sessionSecret: process.env.SESSION_SECRET || 'dogfood_session_secret_cookie_vault_key_2026',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  bootstrapAdmin: {
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@dogfood.local',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'DogfoodAdmin123!',
  }
};
