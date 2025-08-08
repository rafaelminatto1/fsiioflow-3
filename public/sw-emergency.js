// 🚨 EMERGENCY SERVICE WORKER - AGGRESSIVE CACHING
const CACHE_NAME = 'fisioflow-emergency-v1';
const CACHE_VERSION = '1.0.0';

// 🚨 CRITICAL: Assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // Add critical CSS and JS files (will be populated by build)
];

// 🚨 EMERGENCY: Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// 🚨 EMERGENCY: Resource patterns and strategies
const RESOURCE_PATTERNS = [
  // Static assets - Cache first
  {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 86400000, // 24 hours
    maxEntries: 100
  },
  
  // API calls - Network first with cache fallback
  {
    pattern: /^\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 300000, // 5 minutes
    maxEntries: 50
  },
  
  // HTML pages - Stale while revalidate
  {
    pattern: /\.html$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 3600000, // 1 hour
    maxEntries: 20
  }
];

// 🚨 EMERGENCY: Install event - Cache critical resources
self.addEventListener('install', (event) => {
  console.log('🚨 Emergency SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🚨 Emergency SW: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('🚨 Emergency SW: Critical assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('🚨 Emergency SW: Install error:', error);
      })
  );
});

// 🚨 EMERGENCY: Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚨 Emergency SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🚨 Emergency SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('🚨 Emergency SW: Activated and claiming clients');
        return self.clients.claim(); // Take control immediately
      })
      .catch((error) => {
        console.error('🚨 Emergency SW: Activate error:', error);
      })
  );
});

// 🚨 EMERGENCY: Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (unless specifically handled)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Find matching pattern and strategy
  const matchedPattern = RESOURCE_PATTERNS.find(pattern => 
    pattern.pattern.test(url.pathname)
  );
  
  if (matchedPattern) {
    event.respondWith(handleRequest(request, matchedPattern));
  } else {
    // Default strategy for unmatched requests
    event.respondWith(
      handleRequest(request, {
        strategy: CACHE_STRATEGIES.NETWORK_FIRST,
        maxAge: 300000, // 5 minutes
        maxEntries: 30
      })
    );
  }
});

// 🚨 EMERGENCY: Request handler with different strategies
async function handleRequest(request, config) {
  const { strategy, maxAge, maxEntries } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, maxAge);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, maxAge);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, maxAge);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request);
      
    default:
      return networkFirst(request, maxAge);
  }
}

// 🚨 EMERGENCY: Cache first strategy
async function cacheFirst(request, maxAge) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
      const now = new Date();
      
      if (now.getTime() - cacheTime.getTime() < maxAge) {
        console.log('🚨 Emergency SW: Cache hit (cache-first):', request.url);
        return cachedResponse;
      }
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    const responseToCache = networkResponse.clone();
    
    // Add cache timestamp
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cache-time', new Date().toISOString());
    
    const modifiedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    cache.put(request, modifiedResponse);
    console.log('🚨 Emergency SW: Network response cached (cache-first):', request.url);
    
    return networkResponse;
    
  } catch (error) {
    console.error('🚨 Emergency SW: Cache first error:', error);
    
    // Fallback to cache if network fails
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🚨 Emergency SW: Fallback to stale cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// 🚨 EMERGENCY: Network first strategy
async function networkFirst(request, maxAge) {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      )
    ]);
    
    // Cache successful response
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = networkResponse.clone();
      
      // Add cache timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('🚨 Emergency SW: Network response cached (network-first):', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('🚨 Emergency SW: Network failed, trying cache:', error.message);
    
    // Fallback to cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🚨 Emergency SW: Cache fallback (network-first):', request.url);
      return cachedResponse;
    }
    
    // Return offline page or error
    if (request.destination === 'document') {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - FisioFlow</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .offline { color: #666; }
            </style>
          </head>
          <body>
            <h1 class="offline">🚨 Sem conexão</h1>
            <p>Você está offline. Verifique sua conexão e tente novamente.</p>
            <button onclick="window.location.reload()">Tentar novamente</button>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    throw error;
  }
}

// 🚨 EMERGENCY: Stale while revalidate strategy
async function staleWhileRevalidate(request, maxAge) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request (don't await)
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const responseToCache = response.clone();
        
        // Add cache timestamp
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cache-time', new Date().toISOString());
        
        const modifiedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        cache.put(request, modifiedResponse);
        console.log('🚨 Emergency SW: Background update (SWR):', request.url);
      }
      return response;
    })
    .catch(error => {
      console.error('🚨 Emergency SW: Background update failed:', error);
      return null;
    });
  
  // Return cached response if available
  if (cachedResponse) {
    console.log('🚨 Emergency SW: Stale cache served (SWR):', request.url);
    return cachedResponse;
  }
  
  // Wait for network response if no cache
  console.log('🚨 Emergency SW: No cache, waiting for network (SWR):', request.url);
  return networkResponsePromise;
}

// 🚨 EMERGENCY: Cache only strategy
async function cacheOnly(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('🚨 Emergency SW: Cache only hit:', request.url);
    return cachedResponse;
  }
  
  throw new Error('No cached response available');
}

// 🚨 EMERGENCY: Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      clearCache()
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(error => event.ports[0].postMessage({ success: false, error: error.message }));
      break;
      
    case 'CACHE_STATS':
      getCacheStats()
        .then(stats => event.ports[0].postMessage({ success: true, stats }))
        .catch(error => event.ports[0].postMessage({ success: false, error: error.message }));
      break;
      
    case 'PRECACHE_URLS':
      precacheUrls(payload.urls)
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(error => event.ports[0].postMessage({ success: false, error: error.message }));
      break;
      
    default:
      console.log('🚨 Emergency SW: Unknown message type:', type);
  }
});

// 🚨 EMERGENCY: Clear all caches
async function clearCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  await Promise.all(keys.map(key => cache.delete(key)));
  console.log('🚨 Emergency SW: Cache cleared');
}

// 🚨 EMERGENCY: Get cache statistics
async function getCacheStats() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  const stats = {
    totalEntries: keys.length,
    cacheSize: 0,
    entries: []
  };
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const size = response.headers.get('content-length') || 0;
      stats.cacheSize += parseInt(size, 10);
      stats.entries.push({
        url: key.url,
        size: size,
        cacheTime: response.headers.get('sw-cache-time')
      });
    }
  }
  
  return stats;
}

// 🚨 EMERGENCY: Precache specific URLs
async function precacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('🚨 Emergency SW: Precached:', url);
      }
    } catch (error) {
      console.error('🚨 Emergency SW: Precache failed for:', url, error);
    }
  });
  
  await Promise.allSettled(promises);
}

// 🚨 EMERGENCY: Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  networkFailures: 0
};

// Export performance metrics periodically
setInterval(() => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_PERFORMANCE_METRICS',
        metrics: performanceMetrics
      });
    });
  });
  
  // Reset metrics
  performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    networkFailures: 0
  };
}, 60000); // Every minute

console.log('🚨 Emergency Service Worker loaded and ready!');
