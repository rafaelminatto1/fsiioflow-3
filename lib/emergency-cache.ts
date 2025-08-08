// 🚨 EMERGENCY CACHING - AGGRESSIVE PERFORMANCE OPTIMIZATION
import Redis from 'ioredis';

// Emergency Redis client with aggressive settings
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Aggressive connection pooling
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  connectTimeout: 5000,
  commandTimeout: 2000,
  
  // Connection pool optimization
  family: 4,
  keepAlive: true,
  
  // Compression for large payloads
  compression: 'gzip',
});

// Emergency cache configuration
const EMERGENCY_CACHE_CONFIG = {
  // Aggressive TTLs for emergency performance
  CRITICAL_QUERIES: 300,    // 5 minutes
  DASHBOARD_DATA: 120,      // 2 minutes  
  PATIENT_LIST: 180,        // 3 minutes
  APPOINTMENT_LIST: 60,     // 1 minute
  STATIC_DATA: 3600,        // 1 hour
  
  // Cache prefixes for organization
  PREFIX: {
    PATIENTS: 'emrg:patients:',
    APPOINTMENTS: 'emrg:appointments:',
    DASHBOARD: 'emrg:dashboard:',
    QUERIES: 'emrg:query:',
    RESULTS: 'emrg:result:',
  }
};

// 🚨 EMERGENCY: Aggressive query caching with compression
export async function emergencyQueryCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = EMERGENCY_CACHE_CONFIG.CRITICAL_QUERIES,
  useCompression: boolean = true
): Promise<{ data: T; cacheHit: boolean; duration: number }> {
  const startTime = Date.now();
  const cacheKey = `${EMERGENCY_CACHE_CONFIG.PREFIX.QUERIES}${key}`;
  
  try {
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const data = useCompression ? 
        JSON.parse(require('zlib').gunzipSync(Buffer.from(cached, 'base64')).toString()) :
        JSON.parse(cached);
        
      return {
        data,
        cacheHit: true,
        duration: Date.now() - startTime
      };
    }
    
    // Cache miss - execute query
    const data = await queryFn();
    
    // Cache result with compression
    const serialized = JSON.stringify(data);
    const toStore = useCompression ?
      require('zlib').gzipSync(serialized).toString('base64') :
      serialized;
    
    // Fire and forget caching (don't wait)
    redis.setex(cacheKey, ttl, toStore).catch(console.error);
    
    return {
      data,
      cacheHit: false,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    console.error(`Emergency cache error for key ${key}:`, error);
    
    // Fallback to direct query
    const data = await queryFn();
    return {
      data,
      cacheHit: false,
      duration: Date.now() - startTime
    };
  }
}

// 🚨 EMERGENCY: Batch cache operations for multiple queries
export async function emergencyBatchCache<T>(
  operations: Array<{
    key: string;
    queryFn: () => Promise<T>;
    ttl?: number;
  }>
): Promise<Array<{ data: T; cacheHit: boolean }>> {
  // Get all cache keys at once
  const cacheKeys = operations.map(op => 
    `${EMERGENCY_CACHE_CONFIG.PREFIX.QUERIES}${op.key}`
  );
  
  try {
    // Batch get from Redis
    const cached = await redis.mget(...cacheKeys);
    
    const results: Array<{ data: T; cacheHit: boolean }> = [];
    const uncachedOperations: Array<{ index: number; operation: typeof operations[0] }> = [];
    
    // Process cached results
    cached.forEach((cachedValue, index) => {
      if (cachedValue) {
        try {
          const data = JSON.parse(cachedValue);
          results[index] = { data, cacheHit: true };
        } catch (error) {
          uncachedOperations.push({ index, operation: operations[index] });
        }
      } else {
        uncachedOperations.push({ index, operation: operations[index] });
      }
    });
    
    // Execute uncached queries in parallel
    if (uncachedOperations.length > 0) {
      const uncachedResults = await Promise.allSettled(
        uncachedOperations.map(({ operation }) => operation.queryFn())
      );
      
      // Process results and cache them
      const cacheOperations: Array<Promise<string>> = [];
      
      uncachedResults.forEach((result, i) => {
        const { index, operation } = uncachedOperations[i];
        
        if (result.status === 'fulfilled') {
          results[index] = { data: result.value, cacheHit: false };
          
          // Cache the result (fire and forget)
          const cacheKey = `${EMERGENCY_CACHE_CONFIG.PREFIX.QUERIES}${operation.key}`;
          const ttl = operation.ttl || EMERGENCY_CACHE_CONFIG.CRITICAL_QUERIES;
          
          cacheOperations.push(
            redis.setex(cacheKey, ttl, JSON.stringify(result.value))
          );
        } else {
          console.error(`Batch cache error for key ${operation.key}:`, result.reason);
          // Set error placeholder or handle appropriately
          results[index] = { data: null as T, cacheHit: false };
        }
      });
      
      // Execute cache operations without waiting
      Promise.allSettled(cacheOperations).catch(console.error);
    }
    
    return results;
    
  } catch (error) {
    console.error('Emergency batch cache error:', error);
    
    // Fallback to executing all queries
    const fallbackResults = await Promise.allSettled(
      operations.map(op => op.queryFn())
    );
    
    return fallbackResults.map(result => ({
      data: result.status === 'fulfilled' ? result.value : null as T,
      cacheHit: false
    }));
  }
}

// 🚨 EMERGENCY: Cache invalidation patterns
export async function emergencyInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`${EMERGENCY_CACHE_CONFIG.PREFIX.QUERIES}*${pattern}*`);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Emergency invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Emergency cache invalidation error:', error);
  }
}

// 🚨 EMERGENCY: Memory-aware caching
export async function emergencyMemoryAwareCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  maxMemoryMB: number = 100
): Promise<{ data: T; cacheHit: boolean }> {
  try {
    // Check Redis memory usage
    const info = await redis.info('memory');
    const usedMemoryMB = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0') / 1024 / 1024;
    
    // If memory usage is high, skip caching
    if (usedMemoryMB > maxMemoryMB) {
      console.warn(`Emergency: Skipping cache due to high memory usage: ${usedMemoryMB}MB`);
      const data = await queryFn();
      return { data, cacheHit: false };
    }
    
    return emergencyQueryCache(key, queryFn, EMERGENCY_CACHE_CONFIG.CRITICAL_QUERIES);
    
  } catch (error) {
    console.error('Emergency memory-aware cache error:', error);
    const data = await queryFn();
    return { data, cacheHit: false };
  }
}

// 🚨 EMERGENCY: Circuit breaker for cache operations
class EmergencyCacheCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 5;
  private readonly resetTimeout = 30000; // 30 seconds
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.isOpen()) {
      throw new Error('Emergency cache circuit breaker is OPEN');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isOpen(): boolean {
    return this.failures >= this.maxFailures && 
           (Date.now() - this.lastFailureTime) < this.resetTimeout;
  }
  
  private onSuccess(): void {
    this.failures = 0;
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}

export const emergencyCacheCircuitBreaker = new EmergencyCacheCircuitBreaker();

// 🚨 EMERGENCY: Cache warming for critical data
export async function emergencyWarmCache(): Promise<void> {
  console.log('🚨 Emergency cache warming started...');
  
  const warmingOperations = [
    // Warm dashboard stats
    {
      key: 'dashboard:stats',
      operation: () => import('../services/optimized/dashboardService').then(s => s.getDashboardStats())
    },
    
    // Warm recent patients
    {
      key: 'patients:recent',
      operation: () => import('../services/optimized/patientService').then(s => s.getPatients({ limit: 20 }))
    },
    
    // Warm today's appointments
    {
      key: 'appointments:today',
      operation: () => import('../services/optimized/appointmentService').then(s => s.getTodaysAppointments())
    },
  ];
  
  try {
    await Promise.allSettled(
      warmingOperations.map(async ({ key, operation }) => {
        try {
          const result = await operation();
          const cacheKey = `${EMERGENCY_CACHE_CONFIG.PREFIX.QUERIES}${key}`;
          await redis.setex(cacheKey, EMERGENCY_CACHE_CONFIG.CRITICAL_QUERIES, JSON.stringify(result));
          console.log(`✅ Emergency warmed cache for: ${key}`);
        } catch (error) {
          console.error(`❌ Emergency cache warming failed for ${key}:`, error);
        }
      })
    );
    
    console.log('🚨 Emergency cache warming completed');
  } catch (error) {
    console.error('Emergency cache warming error:', error);
  }
}

// 🚨 EMERGENCY: Export optimized cache functions
export {
  EMERGENCY_CACHE_CONFIG,
  redis as emergencyRedis
};
