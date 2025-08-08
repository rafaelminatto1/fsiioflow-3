// middleware.ts - Next.js middleware for unified request handling
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './middleware/auth.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { performanceMiddleware } from './middleware/performance.middleware';

// Middleware configuration
const MIDDLEWARE_CONFIG = {
  enableAuth: true,
  enableCors: true,
  enablePerformance: true,
  enableLogging: process.env.NODE_ENV === 'development',
};

// Routes that should skip certain middleware
const SKIP_AUTH_ROUTES = [
  '/api/auth',
  '/api/health',
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
];

const SKIP_CORS_ROUTES = [
  '/_next',
  '/favicon.ico',
  '/manifest.json',
];

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log request in development
  if (MIDDLEWARE_CONFIG.enableLogging) {
    console.log(`🔄 Middleware: ${request.method} ${pathname}`);
  }
  
  let response: NextResponse | null = null;
  
  try {
    // 1. Performance monitoring (always first)
    if (MIDDLEWARE_CONFIG.enablePerformance) {
      response = await performanceMiddleware(request);
      if (response) return response;
    }
    
    // 2. CORS handling for API routes
    if (MIDDLEWARE_CONFIG.enableCors && !SKIP_CORS_ROUTES.some(route => pathname.startsWith(route))) {
      response = await corsMiddleware(request);
      if (response) return response;
    }
    
    // 3. Authentication (skip for public routes)
    if (MIDDLEWARE_CONFIG.enableAuth && !SKIP_AUTH_ROUTES.some(route => pathname.startsWith(route))) {
      response = await authMiddleware(request);
      if (response) return response;
    }
    
    // 4. Continue to next middleware or route handler
    return NextResponse.next();
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return appropriate error response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal middleware error' },
        { status: 500 }
      );
    }
    
    // Redirect to error page for non-API routes
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|manifest.json).*)',
  ],
};
