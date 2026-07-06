import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/axxeler_crm'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Axxeler CRM <noreply@axxeler.in>'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  WHATSAPP_GRAPH_VERSION: z.string().default('v20.0'),
  UPLOAD_DIR: z.string().default('uploads'),
  // Public self-registration. Left unset it is OFF in production (an internal CRM
  // should not let anonymous users create accounts) and ON elsewhere for convenience.
  ALLOW_PUBLIC_SIGNUP: z.string().optional(),
});

export const env = schema.parse(process.env);

export const ALLOW_PUBLIC_SIGNUP = env.ALLOW_PUBLIC_SIGNUP
  ? env.ALLOW_PUBLIC_SIGNUP === 'true'
  : env.NODE_ENV !== 'production';

// Refuse to boot in production with the shipped default signing secrets — they
// are public knowledge and would allow anyone to forge tokens.
const DEFAULT_SECRETS = ['dev-access-secret-change-me', 'dev-refresh-secret-change-me'];
if (env.NODE_ENV === 'production') {
  if (
    DEFAULT_SECRETS.includes(env.JWT_ACCESS_SECRET) ||
    DEFAULT_SECRETS.includes(env.JWT_REFRESH_SECRET) ||
    env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET
  ) {
    throw new Error(
      'Refusing to start in production: set strong, distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables.',
    );
  }
}
