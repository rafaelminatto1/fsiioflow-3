// hooks/useBodyMap.ts - Custom hook for BodyMap functionality
import { useState, useEffect, useCallback } from 'react';
import { PainPoint, UseBodyMapReturn, BodyMapAnalytics } from '../src/types/bodymap.types';
import { bodyMapService } from '../services/bodyMapService';

export function useBodyMap(patientId: string): UseBodyMapReturn {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Carregar pontos de dor
  const loadPainPoints = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const points = await bodyMapService.getPainPoints(patientId, selectedDate);
      setPainPoints(points);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar pontos de dor';
      setError(errorMessage);
      console.error('Erro ao carregar pontos de dor:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedDate]);

  // Carregar pontos quando patientId ou data mudar
  useEffect(() => {
    loadPainPoints();
  }, [loadPainPoints]);

  // Adicionar novo ponto de dor
  const addPainPoint = useCallback(async (
    pointData: Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PainPoint> => {
    try {
      const newPoint = await bodyMapService.createPainPoint(pointData);
      setPainPoints(prev => [...prev, newPoint]);
      return newPoint;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar ponto de dor';
      setError(errorMessage);
      console.error('Erro ao adicionar ponto de dor:', err);
      throw err;
    }
  }, []);

  // Atualizar ponto de dor existente
  const updatePainPoint = useCallback(async (
    id: string, 
    updates: Partial<PainPoint>
  ): Promise<PainPoint> => {
    try {
      const updatedPoint = await bodyMapService.updatePainPoint(id, updates);
      setPainPoints(prev =>
        prev.map(point => point.id === id ? updatedPoint : point)
      );
      return updatedPoint;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar ponto de dor';
      setError(errorMessage);
      console.error('Erro ao atualizar ponto de dor:', err);
      throw err;
    }
  }, []);

  // Deletar ponto de dor
  const deletePainPoint = useCallback(async (id: string): Promise<void> => {
    try {
      await bodyMapService.deletePainPoint(id);
      setPainPoints(prev => prev.filter(point => point.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar ponto de dor';
      setError(errorMessage);
      console.error('Erro ao deletar ponto de dor:', err);
      throw err;
    }
  }, []);

  // Refresh manual dos dados
  const refresh = useCallback(async (): Promise<void> => {
    await loadPainPoints();
  }, [loadPainPoints]);

  return {
    painPoints,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
    refresh,
  };
}

// Hook para analytics do mapa corporal
export function useBodyMapAnalytics(patientId: string) {
  const [analytics, setAnalytics] = useState<BodyMapAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const analyticsData = await bodyMapService.getAnalytics(patientId);
      setAnalytics(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar analytics';
      setError(errorMessage);
      console.error('Erro ao carregar analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics,
  };
}

// Hook para responsividade
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  return screenSize;
}

// Hook para debounce (útil para atualizações em tempo real)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}