// middleware/performance.middleware.ts - Performance monitoring and optimization middleware
import { NextRequest, NextResponse } from 'next/server';

// Performance metrics interface
interface PerformanceMetrics {
  requestId: string;
  method: string;
  pathname: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  origin?: string;
  cacheHit?: boolean;
  dbQueries?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

// In-memory metrics storage (in production, use Redis or external service)
const metricsStore = new Map<string, PerformanceMetrics>();
const MAX_METRICS_STORED = 1000;

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Performance monitoring middleware
export async function performanceMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const { pathname, search } = request.nextUrl;
  
  // Create performance metrics entry
  const metrics: PerformanceMetrics = {
    requestId,
    method: request.method,
    pathname: pathname + search,
    startTime,
    userAgent: request.headers.get('user-agent') || undefined,
    origin: request.headers.get('origin') || undefined,
  };
  
  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-start-time', startTime.toString());
  
  // Store initial metrics
  metricsStore.set(requestId, metrics);
  
  // Clean up old metrics
  if (metricsStore.size > MAX_METRICS_STORED) {
    const oldestKey = metricsStore.keys().next().value;
    metricsStore.delete(oldestKey);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Complete performance tracking (call this in API routes)
export function completePerformanceTracking(
  requestId: string,
  statusCode: number,
  additionalMetrics?: Partial<PerformanceMetrics>
): void {
  const metrics = metricsStore.get(requestId);
  
  if (metrics) {
    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    
    // Update metrics
    const updatedMetrics: PerformanceMetrics = {
      ...metrics,
      endTime,
      duration,
      statusCode,
      memoryUsage: process.memoryUsage(),
      ...additionalMetrics,
    };
    
    metricsStore.set(requestId, updatedMetrics);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${metrics.method} ${metrics.pathname} - ${duration}ms`);
    }
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development' && process.env.LOG_PERFORMANCE === 'true') {
      console.log(`Performance: ${metrics.method} ${metrics.pathname} - ${duration}ms (${statusCode})`);
    }
  }
}

// Performance wrapper for API routes
export function withPerformanceTracking(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const requestId = request.headers.get('x-request-id') || generateRequestId();
    const startTime = parseInt(request.headers.get('x-start-time') || Date.now().toString());
    
    try {
      // Execute handler
      const result = await handler(request, context);
      
      // Track successful completion
      let statusCode = 200;
      if (result instanceof NextResponse) {
        statusCode = result.status;
      }
      
      completePerformanceTracking(requestId, statusCode);
      
      // Add performance headers to response
      if (result instanceof NextResponse) {
        const duration = Date.now() - startTime;
        result.headers.set('X-Response-Time', `${duration}ms`);
        result.headers.set('X-Request-ID', requestId);
      }
      
      return result;
      
    } catch (error) {
      // Track error completion
      completePerformanceTracking(requestId, 500);
      throw error;
    }
  };
}

// Get performance statistics
export function getPerformanceStats(): {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, number>;
} {
  const metrics = Array.from(metricsStore.values());
  const completedMetrics = metrics.filter(m => m.duration !== undefined);
  
  if (completedMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRate: 0,
      requestsByMethod: {},
      requestsByPath: {},
    };
  }
  
  const totalRequests = completedMetrics.length;
  const averageResponseTime = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalRequests;
  const slowRequests = completedMetrics.filter(m => (m.duration || 0) > 1000).length;
  const errorRequests = completedMetrics.filter(m => (m.statusCode || 0) >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;
  
  // Group by method
  const requestsByMethod: Record<string, number> = {};
  completedMetrics.forEach(m => {
    requestsByMethod[m.method] = (requestsByMethod[m.method] || 0) + 1;
  });
  
  // Group by path (simplified)
  const requestsByPath: Record<string, number> = {};
  completedMetrics.forEach(m => {
    const simplePath = m.pathname.split('?')[0]; // Remove query params
    requestsByPath[simplePath] = (requestsByPath[simplePath] || 0) + 1;
  });
  
  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    slowRequests,
    errorRate: Math.round(errorRate * 100) / 100,
    requestsByMethod,
    requestsByPath,
  };
}

// Memory usage monitoring
export function getMemoryStats(): NodeJS.MemoryUsage & { percentage: number } {
  const usage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const percentage = Math.round((usage.rss / totalMemory) * 100 * 100) / 100;
  
  return {
    ...usage,
    percentage,
  };
}

// Cache performance tracking
export function trackCachePerformance(requestId: string, cacheHit: boolean): void {
  const metrics = metricsStore.get(requestId);
  if (metrics) {
    metrics.cacheHit = cacheHit;
    metricsStore.set(requestId, metrics);
  }
}

// Database query tracking
export function trackDatabaseQueries(requestId: string, queryCount: number): void {
  const metrics = metricsStore.get(requestId);
  if (metrics) {
    metrics.dbQueries = (metrics.dbQueries || 0) + queryCount;
    metricsStore.set(requestId, metrics);
  }
}

// Performance alert system
export function checkPerformanceAlerts(): void {
  const stats = getPerformanceStats();
  
  // Alert on high average response time
  if (stats.averageResponseTime > 2000) {
    console.warn(`Performance Alert: High average response time: ${stats.averageResponseTime}ms`);
  }
  
  // Alert on high error rate
  if (stats.errorRate > 5) {
    console.warn(`Performance Alert: High error rate: ${stats.errorRate}%`);
  }
  
  // Alert on memory usage
  const memoryStats = getMemoryStats();
  if (memoryStats.percentage > 80) {
    console.warn(`Performance Alert: High memory usage: ${memoryStats.percentage}%`);
  }
}

// Cleanup old metrics periodically
export function cleanupMetrics(): void {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  
  for (const [requestId, metrics] of metricsStore.entries()) {
    if (metrics.startTime < cutoffTime) {
      metricsStore.delete(requestId);
    }
  }
}

// Performance monitoring dashboard data
export function getPerformanceDashboard(): {
  stats: ReturnType<typeof getPerformanceStats>;
  memory: ReturnType<typeof getMemoryStats>;
  recentRequests: PerformanceMetrics[];
  alerts: string[];
} {
  const stats = getPerformanceStats();
  const memory = getMemoryStats();
  
  // Get recent requests (last 50)
  const recentRequests = Array.from(metricsStore.values())
    .filter(m => m.duration !== undefined)
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
    .slice(0, 50);
  
  // Generate alerts
  const alerts: string[] = [];
  if (stats.averageResponseTime > 2000) {
    alerts.push(`High average response time: ${stats.averageResponseTime}ms`);
  }
  if (stats.errorRate > 5) {
    alerts.push(`High error rate: ${stats.errorRate}%`);
  }
  if (memory.percentage > 80) {
    alerts.push(`High memory usage: ${memory.percentage}%`);
  }
  if (stats.slowRequests > stats.totalRequests * 0.1) {
    alerts.push(`High number of slow requests: ${stats.slowRequests}`);
  }
  
  return {
    stats,
    memory,
    recentRequests,
    alerts,
  };
}
