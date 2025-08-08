// 🚨 EMERGENCY CACHING SYSTEM
// Aggressive in-memory caching to reduce database load immediately

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class EmergencyCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Prevent memory overflow
  
  // Emergency TTL settings (in milliseconds)
  private readonly TTL = {
    DASHBOARD: 30 * 1000,      // 30 seconds
    PATIENTS: 60 * 1000,       // 1 minute  
    APPOINTMENTS: 30 * 1000,   // 30 seconds
    SOAP_NOTES: 120 * 1000,    // 2 minutes
    TREATMENTS: 300 * 1000,    // 5 minutes
    THERAPISTS: 600 * 1000,    // 10 minutes
  };

  private readonly CACHE_KEYS = {
    DASHBOARD: 'emrg:dashboard:',
    PATIENTS: 'emrg:patients:',
    APPOINTMENTS: 'emrg:appointments:',
    SOAP_NOTES: 'emrg:soap:',
    TREATMENTS: 'emrg:treatments:',
    THERAPISTS: 'emrg:therapists:',
  };

  set<T>(key: string, data: T, ttl?: number): void {
    // Auto-cleanup if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.TTL.DASHBOARD,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Pattern-based deletion for cache invalidation
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.maxSize * 0.2); // Remove 20%
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  // Cache statistics for monitoring
  getStats() {
    const now = Date.now();
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      hitRate: this.calculateHitRate(),
    };
  }

  private hitRate = { hits: 0, misses: 0 };
  
  private calculateHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total > 0 ? (this.hitRate.hits / total) * 100 : 0;
  }

  // Record cache hit/miss for statistics
  recordHit(): void {
    this.hitRate.hits++;
  }

  recordMiss(): void {
    this.hitRate.misses++;
  }

  // Emergency cache warming for critical data
  async warmCache() {
    console.log('🔥 Warming emergency cache...');
    
    try {
      // Warm dashboard stats
      const dashboardKey = this.CACHE_KEYS.DASHBOARD + 'stats';
      if (!this.get(dashboardKey)) {
        // This would normally fetch from database
        // For now, we'll set a placeholder to prevent repeated calls
        this.set(dashboardKey, { loading: true }, 5000);
      }

      // Warm today's appointments
      const todayKey = this.CACHE_KEYS.APPOINTMENTS + 'today';
      if (!this.get(todayKey)) {
        this.set(todayKey, { loading: true }, 5000);
      }

      // Warm active therapists
      const therapistsKey = this.CACHE_KEYS.THERAPISTS + 'active';
      if (!this.get(therapistsKey)) {
        this.set(therapistsKey, { loading: true }, 10000);
      }

      console.log('✅ Emergency cache warmed');
    } catch (error) {
      console.error('❌ Error warming cache:', error);
    }
  }

  // Clear all cache (emergency reset)
  clear(): void {
    this.cache.clear();
    this.hitRate = { hits: 0, misses: 0 };
    console.log('🗑️ Emergency cache cleared');
  }
}

// Singleton instance
export const emergencyCache = new EmergencyCache();

// Cache wrapper function for easy usage
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try cache first
      const cached = emergencyCache.get<T>(key);
      if (cached) {
        emergencyCache.recordHit();
        resolve(cached);
        return;
      }

      // Cache miss - fetch data
      emergencyCache.recordMiss();
      const data = await fetcher();
      
      // Cache the result
      emergencyCache.set(key, data, ttl);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate all patient-related cache
  patients: (patientId?: string) => {
    if (patientId) {
      emergencyCache.deletePattern(`*patients*${patientId}*`);
      emergencyCache.deletePattern(`*appointments*${patientId}*`);
      emergencyCache.deletePattern(`*soap*${patientId}*`);
    } else {
      emergencyCache.deletePattern('*patients*');
    }
    emergencyCache.deletePattern('*dashboard*'); // Dashboard shows patient counts
  },

  // Invalidate appointment-related cache
  appointments: (appointmentId?: string) => {
    if (appointmentId) {
      emergencyCache.deletePattern(`*appointments*${appointmentId}*`);
    } else {
      emergencyCache.deletePattern('*appointments*');
    }
    emergencyCache.deletePattern('*dashboard*'); // Dashboard shows appointment stats
  },

  // Invalidate dashboard cache
  dashboard: () => {
    emergencyCache.deletePattern('*dashboard*');
  },

  // Invalidate all cache (nuclear option)
  all: () => {
    emergencyCache.clear();
  },
};

// Start cache warming on module load
if (typeof window !== 'undefined') {
  // Only in browser
  setTimeout(() => {
    emergencyCache.warmCache();
  }, 1000);
}

export default emergencyCache;