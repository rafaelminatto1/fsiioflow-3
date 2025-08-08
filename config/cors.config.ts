// config/cors.config.ts - Unified CORS configuration
import { NextRequest } from 'next/server';

export interface CorsConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  optionsSuccessStatus: number;
}

// Environment-based CORS configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

export const corsConfig: CorsConfig = {
  origin: isDevelopment ? true : corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'Authorization',
    'X-Client-Info',
    'X-Request-ID',
  ],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'),
  optionsSuccessStatus: 200,
};

// CORS headers generator
export function getCorsHeaders(origin?: string): HeadersInit {
  const allowedOrigin = corsConfig.origin === true 
    ? origin || '*'
    : Array.isArray(corsConfig.origin)
    ? corsConfig.origin.includes(origin || '') ? origin : corsConfig.origin[0]
    : corsConfig.origin;

  return {
    'Access-Control-Allow-Origin': allowedOrigin.toString(),
    'Access-Control-Allow-Credentials': corsConfig.credentials.toString(),
    'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
    'Access-Control-Max-Age': corsConfig.maxAge.toString(),
    'Vary': 'Origin',
  };
}

// CORS validation utility
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  if (corsConfig.origin === true) return true;
  if (typeof corsConfig.origin === 'string') return corsConfig.origin === origin;
  if (Array.isArray(corsConfig.origin)) return corsConfig.origin.includes(origin);
  
  return false;
}

// Preflight request handler
export function handlePreflight(request: NextRequest): Response {
  const origin = request.headers.get('origin');
  
  if (!isOriginAllowed(origin)) {
    return new Response('CORS: Origin not allowed', { status: 403 });
  }

  return new Response(null, {
    status: corsConfig.optionsSuccessStatus,
    headers: getCorsHeaders(origin || undefined),
  });
}

// CORS middleware for API routes
export function withCors(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const origin = request.headers.get('origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }
    
    // Execute the handler
    const response = await handler(request, context);
    
    // Add CORS headers to response
    if (response instanceof Response) {
      const corsHeaders = getCorsHeaders(origin || undefined);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

// Development CORS bypass (for local development only)
export const devCorsConfig = {
  ...corsConfig,
  origin: true,
  credentials: true,
} as CorsConfig;
