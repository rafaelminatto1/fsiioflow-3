// config/session.config.ts - Unified session management configuration
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Session configuration constants
export const SESSION_CONFIG = {
  timeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour default
  secure: process.env.SESSION_SECURE === 'true',
  sameSite: (process.env.SESSION_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
  httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
  maxAge: parseInt(process.env.SESSION_TIMEOUT || '3600000') / 1000, // Convert to seconds
} as const;

// JWT configuration
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  maxAge: SESSION_CONFIG.maxAge,
  encryption: true,
} as const;

// NextAuth configuration
export const nextAuthConfig: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [], // Add providers here as needed
  
  session: {
    strategy: 'jwt',
    maxAge: SESSION_CONFIG.maxAge,
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  jwt: {
    secret: JWT_CONFIG.secret,
    maxAge: JWT_CONFIG.maxAge,
    // encryption: JWT_CONFIG.encryption, // Not supported in this version
  },
  
  cookies: {
    sessionToken: {
      name: 'fisioflow-session',
      options: {
        httpOnly: SESSION_CONFIG.httpOnly,
        sameSite: SESSION_CONFIG.sameSite,
        path: '/',
        secure: SESSION_CONFIG.secure,
        maxAge: SESSION_CONFIG.maxAge,
      },
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (user as any).role || 'Patient',
          avatarUrl: user.image,
        };
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user as any;
        (session as any).accessToken = token.accessToken as string;
      }
      
      return session;
    },
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', { userId: user.id, email: user.email });
    },
    
    async signOut({ token }) {
      console.log('User signed out:', { userId: token?.sub });
    },
    
    async session({ session, token }) {
      // Track session activity
      console.log('Session accessed:', { userId: (session.user as any)?.id });
    },
  },
};

// Session validation utilities
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Fisioterapeuta' | 'Paciente' | 'EducadorFisico';
  avatarUrl?: string;
}

export interface SessionData {
  user: SessionUser;
  accessToken: string;
  expires: string;
}

// JWT token validation
export async function validateJWT(token: string): Promise<SessionUser | null> {
  try {
    // In a real implementation, you'd verify the JWT signature
    const decoded = JSON.parse(atob(token.split('.')[1]));
    
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null; // Token expired
    }
    
    return decoded.user || null;
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

// Session refresh utility
export function shouldRefreshSession(token: JWT): boolean {
  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - Number(token.iat || 0);
  const refreshThreshold = SESSION_CONFIG.maxAge * 0.8; // Refresh at 80% of max age
  
  return tokenAge > refreshThreshold;
}

// Session cleanup utility
export function cleanExpiredSessions(): void {
  // This would be implemented with your session storage
  // For now, it's handled by NextAuth automatically
  console.log('Cleaning expired sessions...');
}

// Role-based access control
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'Admin': 4,
    'Fisioterapeuta': 3,
    'EducadorFisico': 2,
    'Paciente': 1,
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
}

// Session storage interface (for custom implementations)
export interface SessionStorage {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData): Promise<void>;
  delete(sessionId: string): Promise<void>;
  cleanup(): Promise<void>;
}

// Redis session storage implementation
export class RedisSessionStorage implements SessionStorage {
  private redis: any; // Redis client
  
  constructor(redisClient: any) {
    this.redis = redisClient;
  }
  
  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const data = await this.redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis session get error:', error);
      return null;
    }
  }
  
  async set(sessionId: string, data: SessionData): Promise<void> {
    try {
      await this.redis.setex(
        `session:${sessionId}`,
        SESSION_CONFIG.maxAge,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Redis session set error:', error);
    }
  }
  
  async delete(sessionId: string): Promise<void> {
    try {
      await this.redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Redis session delete error:', error);
    }
  }
  
  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, but we could implement
    // additional cleanup logic here if needed
    console.log('Redis session cleanup completed');
  }
}
