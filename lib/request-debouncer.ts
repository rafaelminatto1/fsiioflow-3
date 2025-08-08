// 🚨 EMERGENCY REQUEST DEBOUNCING - PREVENT DUPLICATE QUERIES
import { emergencyCache } from './emergency-cache';

// Request debouncing configuration
const DEBOUNCE_CONFIG = {
  DEFAULT_DELAY: 300,        // 300ms debounce
  AGGRESSIVE_DELAY: 100,     // 100ms for critical queries
  MAX_PENDING: 50,           // Max pending requests
  CLEANUP_INTERVAL: 30000,   // 30 seconds cleanup
};

// Pending requests storage
const pendingRequests = new Map<string, {
  promise: Promise<any>;
  timestamp: number;
  timeout: NodeJS.Timeout;
}>();

// Request frequency tracking
const requestFrequency = new Map<string, {
  count: number;
  lastRequest: number;
  windowStart: number;
}>();

// 🚨 EMERGENCY: Aggressive request debouncing
export function emergencyDebounceRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  delay: number = DEBOUNCE_CONFIG.DEFAULT_DELAY,
  maxAge: number = 5000
): Promise<T> {
  const now = Date.now();
  
  // Check if request is already pending
  const existing = pendingRequests.get(key);
  if (existing && (now - existing.timestamp) < maxAge) {
    return existing.promise;
  }
  
  // Clear existing timeout if any
  if (existing) {
    clearTimeout(existing.timeout);
    pendingRequests.delete(key);
  }
  
  // Create new debounced promise
  const promise = new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(async () => {
      try {
        // Execute the request
        const result = await requestFn();
        
        // Clean up
        pendingRequests.delete(key);
        
        resolve(result);
      } catch (error) {
        // Clean up on error
        pendingRequests.delete(key);
        reject(error);
      }
    }, delay);
    
    // Store pending request
    pendingRequests.set(key, {
      promise,
      timestamp: now,
      timeout
    });
  });
  
  return promise;
}

// 🚨 EMERGENCY: Smart debouncing based on request frequency
export function emergencySmartDebounce<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    minDelay?: number;
    maxDelay?: number;
    windowMs?: number;
    maxRequests?: number;
  } = {}
): Promise<T> {
  const {
    minDelay = 100,
    maxDelay = 1000,
    windowMs = 10000,
    maxRequests = 10
  } = options;
  
  const now = Date.now();
  
  // Track request frequency
  let frequency = requestFrequency.get(key);
  if (!frequency || (now - frequency.windowStart) > windowMs) {
    frequency = {
      count: 1,
      lastRequest: now,
      windowStart: now
    };
  } else {
    frequency.count++;
    frequency.lastRequest = now;
  }
  
  requestFrequency.set(key, frequency);
  
  // Calculate dynamic delay based on frequency
  const requestsPerSecond = frequency.count / ((now - frequency.windowStart) / 1000);
  const dynamicDelay = Math.min(
    maxDelay,
    Math.max(minDelay, requestsPerSecond * 50) // 50ms per request/second
  );
  
  // If too many requests, use cache instead
  if (frequency.count > maxRequests) {
    console.warn(`🚨 Emergency: Too many requests for ${key}, using cache`);
    const cached = emergencyCache.get(key);
    if (cached) return cached;
    const result = await requestFn();
    emergencyCache.set(key, result, 60);
    return result;
  }
  
  return emergencyDebounceRequest(key, requestFn, dynamicDelay);
}

// 🚨 EMERGENCY: Batch request debouncing
export class EmergencyBatchDebouncer<T> {
  private batches = new Map<string, {
    requests: Array<{
      resolve: (value: T) => void;
      reject: (error: any) => void;
      key: string;
    }>;
    timeout: NodeJS.Timeout;
  }>();
  
  constructor(
    private batchFn: (keys: string[]) => Promise<T[]>,
    private delay: number = DEBOUNCE_CONFIG.DEFAULT_DELAY,
    private maxBatchSize: number = 10
  ) {}
  
  request(key: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const batchKey = this.getBatchKey(key);
      let batch = this.batches.get(batchKey);
      
      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(() => this.executeBatch(batchKey), this.delay)
        };
        this.batches.set(batchKey, batch);
      }
      
      batch.requests.push({ resolve, reject, key });
      
      // Execute immediately if batch is full
      if (batch.requests.length >= this.maxBatchSize) {
        clearTimeout(batch.timeout);
        this.executeBatch(batchKey);
      }
    });
  }
  
  private getBatchKey(key: string): string {
    // Group similar requests together
    return key.split(':')[0] || 'default';
  }
  
  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;
    
    this.batches.delete(batchKey);
    
    try {
      const keys = batch.requests.map(req => req.key);
      const results = await this.batchFn(keys);
      
      // Resolve individual requests
      batch.requests.forEach((request, index) => {
        if (results[index] !== undefined) {
          request.resolve(results[index]);
        } else {
          request.reject(new Error(`No result for key: ${request.key}`));
        }
      });
      
    } catch (error) {
      // Reject all requests in batch
      batch.requests.forEach(request => request.reject(error));
    }
  }
}

// 🚨 EMERGENCY: Request deduplication
const requestDeduplication = new Map<string, Promise<any>>();

export function emergencyDeduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  maxAge: number = 5000
): Promise<T> {
  // Check for existing request
  const existing = requestDeduplication.get(key);
  if (existing) {
    return existing;
  }
  
  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up after completion
    setTimeout(() => {
      requestDeduplication.delete(key);
    }, maxAge);
  });
  
  requestDeduplication.set(key, promise);
  return promise;
}

// 🚨 EMERGENCY: Cleanup function
export function emergencyCleanupRequests(): void {
  const now = Date.now();
  
  // Clean up old pending requests
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > 30000) { // 30 seconds
      clearTimeout(request.timeout);
      pendingRequests.delete(key);
    }
  }
  
  // Clean up old frequency tracking
  for (const [key, frequency] of requestFrequency.entries()) {
    if (now - frequency.windowStart > 60000) { // 1 minute
      requestFrequency.delete(key);
    }
  }
  
  console.log(`🚨 Emergency cleanup: ${pendingRequests.size} pending, ${requestFrequency.size} tracked`);
}

// 🚨 EMERGENCY: Auto cleanup
setInterval(emergencyCleanupRequests, DEBOUNCE_CONFIG.CLEANUP_INTERVAL);

// 🚨 EMERGENCY: Request rate limiter
export class EmergencyRateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    let requestTimes = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => now - time < this.windowMs);
    
    // Check if under limit
    if (requestTimes.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);
    
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const now = Date.now();
    let requestTimes = this.requests.get(key) || [];
    requestTimes = requestTimes.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - requestTimes.length);
  }
}

export const emergencyRateLimiter = new EmergencyRateLimiter();

// 🚨 EMERGENCY: Combined debouncing + caching + deduplication
export async function emergencyOptimizedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    debounceMs?: number;
    cacheSeconds?: number;
    enableDeduplication?: boolean;
    enableRateLimit?: boolean;
  } = {}
): Promise<{ data: T; cacheHit: boolean; debounced: boolean; rateLimited: boolean }> {
  const {
    debounceMs = 200,
    cacheSeconds = 60,
    enableDeduplication = true,
    enableRateLimit = true
  } = options;
  
  let rateLimited = false;
  let debounced = false;
  
  // Check rate limit first
  if (enableRateLimit && !emergencyRateLimiter.canMakeRequest(key)) {
    rateLimited = true;
    // Return cached data if available
    try {
      const cached = emergencyCache.get(key);
      if (!cached) {
        const result = await requestFn();
        emergencyCache.set(key, result, cacheSeconds);
        return { data: result, cacheHit: false, debounced: false, rateLimited: true };
      }
      return { 
        data: cached, 
        cacheHit: true, 
        debounced: false, 
        rateLimited: true 
      };
    } catch (error) {
      throw new Error(`Rate limited and no cache available for: ${key}`);
    }
  }
  
  // Create optimized request function
  const optimizedRequestFn = async (): Promise<T> => {
    let finalRequestFn = requestFn;
    
    // Apply deduplication
    if (enableDeduplication) {
      finalRequestFn = () => emergencyDeduplicateRequest(key, requestFn);
    }
    
    // Apply debouncing
    if (debounceMs > 0) {
      debounced = true;
      return emergencyDebounceRequest(`debounce:${key}`, finalRequestFn, debounceMs);
    }
    
    return finalRequestFn();
  };
  
  // Apply caching
  const cached = emergencyCache.get(key);
  let result;
  let cacheHit = false;
  
  if (cached) {
    result = cached;
    cacheHit = true;
  } else {
    result = await optimizedRequestFn();
    emergencyCache.set(key, result, cacheSeconds);
  }
  
  return {
    data: result,
    cacheHit: cacheHit,
    debounced,
    rateLimited
  };
}
