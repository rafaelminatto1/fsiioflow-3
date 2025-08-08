// middleware/auth.middleware.ts - JWT validation and authentication middleware
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { validateJWT, hasPermission, SessionUser } from '../config/session.config';

// Protected routes configuration
const PROTECTED_ROUTES = {
  '/api/patients': ['Fisioterapeuta', 'Admin'],
  '/api/appointments': ['Fisioterapeuta', 'Admin'],
  '/api/dashboard': ['Fisioterapeuta', 'Admin'],
  '/api/admin': ['Admin'],
  '/dashboard': ['Fisioterapeuta', 'Admin'],
  '/patients': ['Fisioterapeuta', 'Admin'],
  '/appointments': ['Fisioterapeuta', 'Admin'],
  '/admin': ['Admin'],
} as const;

// Public routes (no authentication required)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
];

// API routes that require authentication
const API_ROUTES = /^\/api\/(?!auth|health)/;

export interface AuthenticatedRequest extends NextRequest {
  user?: SessionUser;
}

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Check if route is protected and get required role
function getRequiredRole(pathname: string): string | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles[0]; // Return minimum required role
    }
  }
  return null;
}

// Extract token from request
async function extractToken(request: NextRequest): Promise<string | null> {
  // Try NextAuth JWT first
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  if (token) {
    return JSON.stringify(token);
  }
  
  // Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try cookie
  const cookieToken = request.cookies.get('fisioflow-session')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

// Main authentication middleware
export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Skip authentication for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  try {
    // Extract and validate token
    const token = await extractToken(request);
    
    if (!token) {
      return redirectToLogin(request);
    }
    
    // Validate JWT and get user
    const user = await validateJWT(token);
    
    if (!user) {
      return redirectToLogin(request);
    }
    
    // Check role-based permissions
    const requiredRole = getRequiredRole(pathname);
    
    if (requiredRole && !hasPermission(user.role, requiredRole)) {
      return new NextResponse('Forbidden: Insufficient permissions', { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Add user to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Return appropriate error response
    if (API_ROUTES.test(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return redirectToLogin(request);
  }
}

// Redirect to login helper
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  
  // Add return URL for redirect after login
  if (!API_ROUTES.test(request.nextUrl.pathname)) {
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
  }
  
  return NextResponse.redirect(loginUrl);
}

// Role-based route protection decorator
export function requireRole(roles: string[]) {
  return function(handler: Function) {
    return async (request: NextRequest, context: any) => {
      const userRole = request.headers.get('x-user-role');
      
      if (!userRole || !roles.some(role => hasPermission(userRole, role))) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      
      return handler(request, context);
    };
  };
}

// API route authentication helper
export function withAuth(handler: Function, requiredRole?: string) {
  return async (request: NextRequest, context: any) => {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userEmail = request.headers.get('x-user-email');
    
    if (!userId || !userRole || !userEmail) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check role if specified
    if (requiredRole && !hasPermission(userRole, requiredRole)) {
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Add user context to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: userId,
      email: userEmail,
      name: request.headers.get('x-user-name') || userEmail,
      role: userRole as any,
      avatarUrl: request.headers.get('x-user-avatar') || undefined,
    };
    
    return handler(authenticatedRequest, context);
  };
}

// Session validation for client-side
export async function validateSession(request: NextRequest): Promise<SessionUser | null> {
  try {
    const token = await extractToken(request);
    if (!token) return null;
    
    return await validateJWT(token);
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Logout helper
export function logout(): NextResponse {
  const response = NextResponse.redirect('/login');
  
  // Clear session cookies
  response.cookies.delete('fisioflow-session');
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  
  return response;
}
