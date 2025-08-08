// 🚨 EMERGENCY SERVICE WORKER REGISTRATION
// Register aggressive caching service worker immediately

import { useEffect } from 'react';

export const registerEmergencyServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported');
    return;
  }

  console.log('🚀 Registering emergency service worker...');

  navigator.serviceWorker
    .register('/sw-emergency.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    })
    .then((registration) => {
      console.log('✅ Emergency SW registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('🔄 New SW version found, updating...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('🆕 New SW version ready');
              
              // Auto-update in emergency mode
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        }
      });

      // Check for updates every 60 seconds in emergency mode
      setInterval(() => {
        registration.update();
      }, 60 * 1000);

    })
    .catch((error) => {
      console.error('❌ Emergency SW registration failed:', error);
    });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_ACTIVATED') {
      console.log('✅ Emergency SW activated');
    }
  });

  // Handle controller change (new SW took over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 SW controller changed, reloading...');
    window.location.reload();
  });
};

// 🚨 EMERGENCY: Hook for React components
export const useEmergencyServiceWorker = () => {
  useEffect(() => {
    registerEmergencyServiceWorker();
  }, []);

  // Utility functions for cache management
  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      console.log('🗑️ Cache clear requested');
    }
  };

  const getCacheStats = async (): Promise<any> => {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CACHE_STATS' }, 
          [messageChannel.port2]
        );
      } else {
        resolve(null);
      }
    });
  };

  return {
    clearCache,
    getCacheStats,
  };
};

// 🚨 EMERGENCY: Performance monitoring component
export const EmergencyPerformanceMonitor: React.FC = () => {
  const { getCacheStats } = useEmergencyServiceWorker();

  useEffect(() => {
    // Monitor performance metrics
    const logPerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        console.log('📊 Emergency Performance Metrics:');
        console.log('  DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
        console.log('  Load Complete:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
        
        paint.forEach((entry) => {
          console.log(`  ${entry.name}:`, entry.startTime, 'ms');
        });

        // Get cache stats
        getCacheStats().then((stats) => {
          if (stats) {
            console.log('📦 Cache Stats:', stats);
          }
        });
      }
    };

    // Log performance after page load
    if (document.readyState === 'complete') {
      setTimeout(logPerformance, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(logPerformance, 1000);
      });
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('🐌 Long task detected:', entry.duration, 'ms');
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // Long task API not supported
      }
    }
  }, [getCacheStats]);

  return null; // This is a monitoring component, no UI
};

export default {
  registerEmergencyServiceWorker,
  useEmergencyServiceWorker,
  EmergencyPerformanceMonitor,
};

