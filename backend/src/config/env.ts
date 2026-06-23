import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z
    .string({
      required_error: 'DATABASE_URL environment variable is required',
    })
    .url('DATABASE_URL must be a valid connection URL')
    .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string',
    }),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().default('mock_jwt_access_secret_for_local_dev'),
  JWT_REFRESH_SECRET: z.string().default('mock_jwt_refresh_secret_for_local_dev'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  ADMIN_NAME: z.string().default('Mitra Admin'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address').default('admin@helpingmitra.com'),
  ADMIN_MOBILE: z.string().length(10, 'ADMIN_MOBILE must be 10 digits').regex(/^\d+$/).default('9999999999'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters').default('AdminPassword@123'),
  PHONEPE_MERCHANT_ID: z.string().optional(),
  PHONEPE_SALT_KEY: z.string().optional(),
  PHONEPE_SALT_INDEX: z.string().optional(),
  PHONEPE_BASE_URL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  UPI_ACCOUNT_ID: z.string({
    required_error: 'UPI_ACCOUNT_ID environment variable is required',
  }),
  UPI_VPA: z.string({
    required_error: 'UPI_VPA environment variable is required',
  }),
  UPI_PAYEE_NAME: z.string({
    required_error: 'UPI_PAYEE_NAME environment variable is required',
  }),
  UPI_NOTE_PREFIX: z.string({
    required_error: 'UPI_NOTE_PREFIX environment variable is required',
  }),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('900000'), // 15 mins
  RATE_LIMIT_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),
  MAX_RESUBMISSION_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3'),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
};

export const env = parseEnv();
export type EnvType = z.infer<typeof envSchema>;
