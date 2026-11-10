import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_TOKEN: z.string().min(1, 'ADMIN_TOKEN is required'),
  DATABASE_PATH: z.string().default('./data/moviehub.db'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration error');
}

export const env = {
  ...parsed.data,
  DATABASE_PATH: path.resolve(process.cwd(), parsed.data.DATABASE_PATH),
};
