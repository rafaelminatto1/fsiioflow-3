// components/optimized/PerformanceMonitor.tsx - Performance monitoring component
import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, Clock, TrendingUp } from 'lucide-react';
import { getConnectionStats } from '../../lib/database';
import { redisHealthCheck, getCacheStats } from '../../lib/redis';

interface PerformanceMetrics {
  database: {
    status: 'healthy' | 'unhealthy';
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    lastQuery?: Date;
  };
  cache: {
    status: 'healthy' | 'unhealthy' | 'disabled';
    keyCount: number;
    memoryUsage: string;
    latency?: number;
  };
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const [dbStats, redisHealth, cacheStats] = await Promise.all([
        getConnectionStats(),
        redisHealthCheck(),
        getCacheStats(),
      ]);

      setMetrics({
        database: {
          status: 'healthy', // Simplified - in reality, check connection health
          totalQueries: dbStats.totalQueries,
          averageDuration: Math.round(dbStats.averageDuration),
          slowQueries: dbStats.slowQueries,
          lastQuery: dbStats.lastQuery,
        },
        cache: {
          status: redisHealth.status,
          keyCount: cacheStats.keyCount,
          memoryUsage: cacheStats.memoryUsage,
          latency: redisHealth.latency,
        },
      });
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.VITE_SHOW_PERFORMANCE_MONITOR) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Performance
            </h3>
            <button
              onClick={fetchMetrics}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </button>
          </div>

          {metrics ? (
            <div className="space-y-4">
              {/* Database Metrics */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-green-500" />
                    Database
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    metrics.database.status === 'healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {metrics.database.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Queries:</span>
                    <span className="ml-1 font-mono">{metrics.database.totalQueries}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Time:</span>
                    <span className="ml-1 font-mono">{metrics.database.averageDuration}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Slow:</span>
                    <span className={`ml-1 font-mono ${
                      metrics.database.slowQueries > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {metrics.database.slowQueries}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last:</span>
                    <span className="ml-1 font-mono text-xs">
                      {metrics.database.lastQuery 
                        ? new Date(metrics.database.lastQuery).toLocaleTimeString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Cache Metrics */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-orange-500" />
                    Cache
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    metrics.cache.status === 'healthy' 
                      ? 'bg-green-100 text-green-800'
                      : metrics.cache.status === 'disabled'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {metrics.cache.status}
                  </span>
                </div>
                {metrics.cache.status !== 'disabled' && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Keys:</span>
                      <span className="ml-1 font-mono">{metrics.cache.keyCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Memory:</span>
                      <span className="ml-1 font-mono">{metrics.cache.memoryUsage}</span>
                    </div>
                    {metrics.cache.latency && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Latency:</span>
                        <span className="ml-1 font-mono">{metrics.cache.latency}ms</span>
                      </div>
                    )}
                  </div>
                )}
                {metrics.cache.status === 'disabled' && (
                  <p className="text-sm text-gray-600">Cache is disabled</p>
                )}
              </div>

              {/* Performance Tips */}
              <div className="border rounded-lg p-3 bg-blue-50">
                <h4 className="font-medium text-blue-900 flex items-center mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Tips
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  {metrics.database.slowQueries > 0 && (
                    <li>• {metrics.database.slowQueries} slow queries detected - consider optimization</li>
                  )}
                  {metrics.cache.status === 'disabled' && (
                    <li>• Enable Redis caching to improve performance</li>
                  )}
                  {metrics.database.averageDuration > 500 && (
                    <li>• Average query time is high - check database indexes</li>
                  )}
                  {metrics.cache.status === 'healthy' && metrics.cache.keyCount === 0 && (
                    <li>• Cache is empty - warm up with some queries</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isLoading ? 'Loading metrics...' : 'Click refresh to load metrics'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
