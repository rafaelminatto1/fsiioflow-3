// app/api/health/route.ts - Health check endpoint simplificado
import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const health = await healthCheck();
    
    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
    }, {
      status: health.status === 'healthy' ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500
    });
  }
}
