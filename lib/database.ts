// lib/database.ts - Database utilities usando Prisma Client
import prisma from './prisma';

// Performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  rowCount: number;
  timestamp: Date;
}

const queryMetrics: QueryMetrics[] = [];

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

// Health check
export async function healthCheck() {
  try {
    const start = Date.now();
    
    await prisma.$queryRaw`SELECT 1`;
    
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

// Re-export prisma instance
export { default as prisma } from './prisma';
export default prisma;
