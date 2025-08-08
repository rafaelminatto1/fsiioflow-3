import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
