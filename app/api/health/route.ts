// app/api/health/route.ts - Health check endpoint
import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '../../../lib/database';
import { redisHealthCheck } from '../../../lib/redis';
import { apiGateway } from '../../../services/api-gateway';
import { getPerformanceDashboard } from '../../../middleware/performance.middleware';

// GET /api/health - System health check
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Run health checks in parallel
    const [dbHealth, redisHealth] = await Promise.all([
      healthCheck(),
      redisHealthCheck(),
    ]);
    
    // Get performance metrics
    const apiStats = apiGateway.getStats();
    const performanceData = getPerformanceDashboard();
    
    const totalDuration = Date.now() - startTime;
    
    // Determine overall health status
    const isHealthy = dbHealth.status === 'healthy' && 
                     (redisHealth.status === 'healthy' || redisHealth.status === 'disabled');
    
    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      duration: totalDuration,
      services: {
        database: {
          status: dbHealth.status,
          duration: dbHealth.duration,
          connection: dbHealth.connection,
          metrics: dbHealth.metrics,
        },
        cache: {
          status: redisHealth.status,
          latency: redisHealth.latency,
          error: redisHealth.error,
        },
        api: {
          totalRequests: apiStats.totalRequests,
          averageResponseTime: apiStats.averageResponseTime,
          successRate: apiStats.successRate,
          errorRate: apiStats.errorRate,
        },
        performance: {
          stats: performanceData.stats,
          memory: performanceData.memory,
          alerts: performanceData.alerts,
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
    
    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
