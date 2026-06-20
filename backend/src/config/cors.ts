import { CorsOptions } from 'cors';
import { env } from './env';

const isLocalIp = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    );
  } catch (e) {
    return false;
  }
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    if (env.CORS_ORIGIN === '*') {
      return callback(null, true);
    }

    const allowedOrigins = env.CORS_ORIGIN.split(',');
    if (allowedOrigins.includes(origin) || isLocalIp(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Idempotency-Key', // Prepared for transaction idempotency checking
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

