// lib/redis.ts - Redis caching layer with intelligent invalidation
import Redis from 'ioredis';

// Environment configuration
const REDIS_URL = process.env.REDIS_URL || process.env.VITE_REDIS_URL || 'redis://localhost:6379';
const DISABLE_CACHE = process.env.DISABLE_CACHE === 'true';
const CACHE_PREFIX = process.env.CACHE_PREFIX || 'fisioflow';

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  PATIENTS_LIST: 60,        // 1 minute
  PATIENT_DETAIL: 300,      // 5 minutes
  DASHBOARD_STATS: 30,      // 30 seconds
  APPOINTMENTS_LIST: 30,    // 30 seconds
  SOAP_NOTES: 600,          // 10 minutes
  TREATMENT_PLANS: 1800,    // 30 minutes
} as const;

// Singleton Redis client
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (DISABLE_CACHE) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keyPrefix: `${CACHE_PREFIX}:`,
      });

      redisClient.on('error', (error) => {
        console.warn('Redis connection error:', error.message);
        // Don't throw - gracefully degrade to no cache
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
      redisClient = null;
    }
  }

  return redisClient;
}

// Generic cache utility with performance monitoring
export async function cacheQuery<T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>
): Promise<{ data: T; cacheHit: boolean; duration: number }> {
  const startTime = Date.now();
  const redis = getRedisClient();

  // If Redis is disabled or unavailable, execute query directly
  if (!redis) {
    const data = await queryFn();
    return { 
      data, 
      cacheHit: false, 
      duration: Date.now() - startTime 
    };
  }

  try {
    // Try to get from cache first
    const cached = await redis.get(key);
    
    if (cached) {
      const data = JSON.parse(cached);
      return { 
        data, 
        cacheHit: true, 
        duration: Date.now() - startTime 
      };
    }

    // Cache miss - execute query
    const data = await queryFn();
    
    // Store in cache (fire and forget - don't wait)
    redis.setex(key, ttl, JSON.stringify(data)).catch((error) => {
      console.warn('Failed to cache result:', error.message);
    });

    return { 
      data, 
      cacheHit: false, 
      duration: Date.now() - startTime 
    };

  } catch (error) {
    console.warn('Cache operation failed:', error);
    // Fallback to direct query
    const data = await queryFn();
    return { 
      data, 
      cacheHit: false, 
      duration: Date.now() - startTime 
    };
  }
}

// Cache invalidation utilities
export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(`${CACHE_PREFIX}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys.map(key => key.replace(`${CACHE_PREFIX}:`, '')));
      console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
}

// Entity-specific invalidation functions
export const invalidatePatientCache = (patientId?: string) => {
  if (patientId) {
    invalidateCache(`patients:${patientId}:*`);
    invalidateCache(`appointments:patient:${patientId}:*`);
  }
  invalidateCache('patients:list:*');
  invalidateCache('dashboard:*');
};

export const invalidateAppointmentCache = (patientId?: string, therapistId?: string) => {
  invalidateCache('appointments:*');
  invalidateCache('dashboard:*');
  
  if (patientId) {
    invalidateCache(`appointments:patient:${patientId}:*`);
  }
  
  if (therapistId) {
    invalidateCache(`appointments:therapist:${therapistId}:*`);
  }
};

export const invalidateDashboardCache = () => {
  invalidateCache('dashboard:*');
};

// Health check
export async function redisHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy' | 'disabled';
  latency?: number;
  error?: string;
}> {
  if (DISABLE_CACHE) {
    return { status: 'disabled' };
  }

  const redis = getRedisClient();
  if (!redis) {
    return { status: 'unhealthy', error: 'Redis client not initialized' };
  }

  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    
    return { status: 'healthy', latency };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Cache statistics
export async function getCacheStats(): Promise<{
  keyCount: number;
  memoryUsage: string;
  hitRate?: number;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return { keyCount: 0, memoryUsage: '0B' };
  }

  try {
    const info = await redis.info('memory');
    const keyCount = await redis.dbsize();
    
    // Extract memory usage from info string
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : '0B';

    return {
      keyCount,
      memoryUsage,
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return { keyCount: 0, memoryUsage: '0B' };
  }
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Batch operations for better performance
export async function cacheMultiple<T>(
  operations: Array<{
    key: string;
    ttl: number;
    data: T;
  }>
): Promise<void> {
  const redis = getRedisClient();
  if (!redis || operations.length === 0) return;

  try {
    const pipeline = redis.pipeline();
    
    for (const { key, ttl, data } of operations) {
      pipeline.setex(key, ttl, JSON.stringify(data));
    }
    
    await pipeline.exec();
  } catch (error) {
    console.warn('Batch cache operation failed:', error);
  }
}

export async function getMultiple(keys: string[]): Promise<Record<string, any>> {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return {};

  try {
    const values = await redis.mget(...keys);
    const result: Record<string, any> = {};
    
    keys.forEach((key, index) => {
      if (values[index]) {
        try {
          result[key] = JSON.parse(values[index]!);
        } catch {
          // Skip invalid JSON
        }
      }
    });
    
    return result;
  } catch (error) {
    console.warn('Batch cache get failed:', error);
    return {};
  }
}
