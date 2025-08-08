// hooks/optimized/useDashboardStats.ts - Optimized dashboard hook with caching awareness
import { useState, useEffect } from 'react';
import { getDashboardStats, type DashboardStats } from '../../services/optimized/dashboardService';

interface UseDashboardStatsResult {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  cacheHit: boolean;
  queryDuration: number;
  refetch: () => void;
}

export default function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [queryDuration, setQueryDuration] = useState(0);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getDashboardStats();
      
      setStats(result.stats);
      setCacheHit(result.cacheHit);
      setQueryDuration(result.queryDuration);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Dashboard Stats:', {
          cacheHit: result.cacheHit,
          duration: `${result.queryDuration}ms`,
          source: result.cacheHit ? 'Cache' : 'Database',
        });
      }
      
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    cacheHit,
    queryDuration,
    refetch: fetchStats,
  };
}
