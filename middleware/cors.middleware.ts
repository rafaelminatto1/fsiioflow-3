// middleware/cors.middleware.ts - CORS handling middleware
import { NextRequest, NextResponse } from 'next/server';
import { corsConfig, getCorsHeaders, isOriginAllowed, handlePreflight } from '../config/cors.config';

// CORS middleware function
export async function corsMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const origin = request.headers.get('origin');
  const { pathname } = request.nextUrl;
  
  // Only apply CORS to API routes
  if (!pathname.startsWith('/api/')) {
    return null; // Continue to next middleware
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handlePreflight(request);
  }
  
  // Validate origin for CORS
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`CORS: Blocked request from origin: ${origin}`);
    return new NextResponse('CORS: Origin not allowed', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  return null; // Continue to next middleware
}

// Add CORS headers to response
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const corsHeaders = getCorsHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// CORS wrapper for API routes
export function withCorsHeaders(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const origin = request.headers.get('origin');
    
    try {
      // Execute the handler
      const response = await handler(request, context);
      
      // Add CORS headers to the response
      if (response instanceof NextResponse) {
        return addCorsHeaders(response, origin || undefined);
      }
      
      // If handler returns data, wrap in NextResponse with CORS headers
      const nextResponse = NextResponse.json(response);
      return addCorsHeaders(nextResponse, origin || undefined);
      
    } catch (error) {
      // Handle errors and still add CORS headers
      console.error('API handler error:', error);
      
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      return addCorsHeaders(errorResponse, origin || undefined);
    }
  };
}

// CORS configuration validator
export function validateCorsConfig(): boolean {
  try {
    // Check if required environment variables are set
    const requiredVars = ['CORS_ORIGIN'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`CORS: Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    // Validate CORS configuration
    if (!corsConfig.origin && corsConfig.origin !== false) {
      console.warn('CORS: Invalid origin configuration');
      return false;
    }
    
    if (!Array.isArray(corsConfig.methods) || corsConfig.methods.length === 0) {
      console.warn('CORS: Invalid methods configuration');
      return false;
    }
    
    if (!Array.isArray(corsConfig.allowedHeaders) || corsConfig.allowedHeaders.length === 0) {
      console.warn('CORS: Invalid allowedHeaders configuration');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('CORS config validation error:', error);
    return false;
  }
}

// Development CORS bypass (use with caution)
export function bypassCorsInDev(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_CORS === 'true') {
    const response = NextResponse.next();
    
    // Add permissive CORS headers for development
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', '*');
    response.headers.set('Access-Control-Allow-Headers', '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  return null;
}

// CORS logging utility
export function logCorsRequest(request: NextRequest): void {
  if (process.env.NODE_ENV === 'development' && process.env.LOG_CORS === 'true') {
    const origin = request.headers.get('origin');
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    
    console.log(`CORS: ${method} ${pathname} from ${origin || 'same-origin'}`);
  }
}

// Security headers for CORS responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

// Add security headers to CORS responses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
