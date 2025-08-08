// 🚨 EMERGENCY SERVICE WORKER - AGGRESSIVE CACHING
const CACHE_NAME = 'fisioflow-emergency-v2';
const CACHE_VERSION = '2.0.0';
const API_CACHE = 'fisioflow-api-v2';
const STATIC_CACHE = 'fisioflow-static-v2';

// 🚨 EMERGENCY: Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/index.html',
  '/index.tsx',
  // Critical CDN resources
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client',
  'https://esm.sh/react-router-dom@^7.7.1',
  'https://esm.sh/lucide-react@^0.534.0',
];

// 🚨 EMERGENCY: API endpoints to cache aggressively
const CACHEABLE_APIS = [
  '/api/dashboard',
  '/api/patients',
  '/api/appointments',
  '/api/therapists',
  '/api/soap-notes',
];

// 🚨 EMERGENCY: Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🚀 Emergency SW installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching critical resources...');
        return cache.addAll(CRITICAL_RESOURCES).catch(error => {
          console.warn('⚠️ Some resources failed to cache:', error);
          // Don't fail completely if some resources fail
          return Promise.resolve();
        });
      }),
      
      // Initialize API cache
      caches.open(API_CACHE).then((cache) => {
        console.log('🗄️ API cache initialized');
        return cache;
      })
    ]).then(() => {
      console.log('✅ Emergency SW installed');
      // Force activation
      return self.skipWaiting();
    })
  );
});

// 🚨 EMERGENCY: Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Emergency SW activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Emergency SW activated');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// 🚨 EMERGENCY: Fetch event - intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 🚨 EMERGENCY: API caching strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // 🚨 EMERGENCY: Static assets caching
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // 🚨 EMERGENCY: HTML pages - stale while revalidate
  if (request.destination === 'document' || url.pathname === '/') {
    event.respondWith(handlePageRequest(request));
    return;
  }
  
  // Default: network first with cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// 🚨 EMERGENCY: Handle API requests with aggressive caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const networkResponse = await fetch(request, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      
      // Add timestamp header for cache validation
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      
      console.log('🔄 API cached:', url.pathname);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.warn('🚨 Network failed, trying cache:', url.pathname);
    
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📦 Serving from cache:', url.pathname);
      return cachedResponse;
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: 'Please check your connection',
        cached: false 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 🚨 EMERGENCY: Handle static assets with long-term caching
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first for static assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('⚡ Static asset from cache:', request.url);
    return cachedResponse;
  }
  
  // Fetch and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('📦 Static asset cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch static asset:', request.url);
    throw error;
  }
}

// 🚨 EMERGENCY: Handle page requests with stale-while-revalidate
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('📄 Page from cache (updating in background):', request.url);
    return cachedResponse;
  }
  
  // Otherwise wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Fallback to offline page or error
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FisioFlow - Offline</title>
      <style>
        body { font-family: system-ui; text-align: center; padding: 50px; }
        .offline { color: #666; }
      </style>
    </head>
    <body>
      <div class="offline">
        <h1>🚨 Application Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `, { 
    status: 503, 
    headers: { 'Content-Type': 'text/html' } 
  });
}

// 🚨 EMERGENCY: Utility functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|json)$/);
}

// 🚨 EMERGENCY: Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync offline actions when connection is restored
  console.log('🔄 Performing background sync...');
  
  try {
    // Clear old API cache entries (older than 5 minutes)
    const apiCache = await caches.open(API_CACHE);
    const requests = await apiCache.keys();
    
    for (const request of requests) {
      const response = await apiCache.match(request);
      if (response) {
        const cachedAt = response.headers.get('sw-cached-at');
        if (cachedAt && Date.now() - parseInt(cachedAt) > 5 * 60 * 1000) {
          await apiCache.delete(request);
          console.log('🗑️ Expired cache entry removed:', request.url);
        }
      }
    }
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// 🚨 EMERGENCY: Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
  
  if (event.data && event.data.type === 'CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
});

// 🚨 EMERGENCY: Cache management utilities
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('🗑️ All caches cleared');
}

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = keys.length;
  }
  
  return {
    caches: stats,
    timestamp: Date.now(),
    version: CACHE_VERSION
  };
}

console.log('🚨 Emergency Service Worker loaded - Version:', CACHE_VERSION);

