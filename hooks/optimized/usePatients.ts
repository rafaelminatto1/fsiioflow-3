// hooks/optimized/usePatients.ts - Optimized patients hook with cursor pagination
import { useState, useCallback } from 'react';
import { getPatients } from '../../services/optimized/patientService';
import type { PatientSummary } from '../../types';

interface UsePatientsResult {
  patients: PatientSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
  cacheHit: boolean;
  queryDuration: number;
  fetchInitialPatients: (filters: { searchTerm: string; statusFilter: string }) => void;
  fetchMorePatients: () => void;
  refetch: () => void;
}

export const usePatients = (): UsePatientsResult => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState({ searchTerm: '', statusFilter: 'All' });
  const [cacheHit, setCacheHit] = useState(false);
  const [queryDuration, setQueryDuration] = useState(0);

  const fetchPatients = useCallback(async (
    filters: { searchTerm: string; statusFilter: string }, 
    cursor?: string | null,
    isLoadMore: boolean = false
  ) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPatients([]); // Clear list for new filters
      }
      
      setError(null);
      
      const result = await getPatients({ 
        ...filters, 
        cursor, 
        limit: 20 
      });
      
      setPatients(prev => isLoadMore ? [...prev, ...result.patients] : result.patients);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      setTotalCount(result.totalCount);
      setCacheHit(result.cacheHit);
      setQueryDuration(result.queryDuration);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log('👥 Patients Query:', {
          cacheHit: result.cacheHit,
          duration: `${result.queryDuration}ms`,
          count: result.patients.length,
          hasMore: !!result.nextCursor,
          source: result.cacheHit ? 'Cache' : 'Database',
        });
      }
      
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch patients:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchInitialPatients = useCallback((filters: { searchTerm: string; statusFilter: string }) => {
    setCurrentFilters(filters);
    fetchPatients(filters);
  }, [fetchPatients]);

  const fetchMorePatients = useCallback(() => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    fetchPatients(currentFilters, nextCursor, true);
  }, [isLoadingMore, hasMore, nextCursor, fetchPatients, currentFilters]);

  const refetch = useCallback(() => {
    fetchPatients(currentFilters);
  }, [fetchPatients, currentFilters]);

  return {
    patients,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    nextCursor,
    totalCount,
    cacheHit,
    queryDuration,
    fetchInitialPatients,
    fetchMorePatients,
    refetch,
  };
};
