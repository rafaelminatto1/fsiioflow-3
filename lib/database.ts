// lib/database.ts - Centralized database client with connection pooling and performance monitoring
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import * as schema from './schema';

// Environment variables with defaults
const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const PGBOUNCER = process.env.PGBOUNCER === 'true';
const PRISMA_LOG_QUERIES = process.env.PRISMA_LOG_QUERIES === 'true';

// Connection configuration with pooling
const connectionConfig = {
  max: PGBOUNCER ? 5 : 10, // Fewer connections with PgBouncer
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for PgBouncer
  onnotice: PRISMA_LOG_QUERIES ? console.log : undefined,
};

// Singleton pattern for connection
let globalConnection: postgres.Sql<{}> | undefined;
let globalDb: ReturnType<typeof drizzle> | undefined;
let supabaseClient: ReturnType<typeof createClient> | undefined;

// Performance monitoring middleware
interface QueryMetrics {
  query: string;
  duration: number;
  rowCount: number;
  timestamp: Date;
}

const queryMetrics: QueryMetrics[] = [];

export function getDatabase() {
  if (!globalDb) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is required but not set');
    }

    // Create connection with optimized settings
    globalConnection = postgres(DATABASE_URL, {
      ...connectionConfig,
      transform: {
        undefined: null,
      },
      // Performance monitoring
      debug: PRISMA_LOG_QUERIES ? (connection, query, params) => {
        console.log('🔍 Query:', query.slice(0, 100) + '...');
        console.log('📊 Params:', params);
      } : false,
    });

    globalDb = drizzle(globalConnection, { schema });
  }

  return globalDb;
}

export function getSupabase() {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      db: {
        schema: 'public',
      },
    });
  }

  return supabaseClient;
}

// Performance monitoring utilities
export function logQueryMetrics(query: string, duration: number, rowCount: number = 0) {
  const metric: QueryMetrics = {
    query: query.slice(0, 100),
    duration,
    rowCount,
    timestamp: new Date(),
  };

  queryMetrics.unshift(metric);
  
  // Keep only last 100 metrics
  if (queryMetrics.length > 100) {
    queryMetrics.pop();
  }

  // Log slow queries
  if (duration > 1000) {
    console.warn('🐌 Slow query detected:', {
      query: metric.query,
      duration: `${duration}ms`,
      rowCount,
    });
  }
}

export function getQueryMetrics() {
  return queryMetrics;
}

export function getConnectionStats() {
  return {
    totalQueries: queryMetrics.length,
    averageDuration: queryMetrics.length > 0 
      ? queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length 
      : 0,
    slowQueries: queryMetrics.filter(m => m.duration > 1000).length,
    lastQuery: queryMetrics[0]?.timestamp,
  };
}

// Graceful shutdown
export async function closeDatabase() {
  if (globalConnection) {
    await globalConnection.end();
    globalConnection = undefined;
    globalDb = undefined;
  }
}

// Health check
export async function healthCheck() {
  try {
    const db = getDatabase();
    const start = Date.now();
    
    await db.execute(sql`SELECT 1`);
    
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration,
      connection: 'active',
      metrics: getConnectionStats(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'failed',
    };
  }
}

// Export the database instance
export const db = getDatabase();
export const supabase = getSupabase();

// Re-export sql for raw queries when needed
export { sql } from 'drizzle-orm';
