// hooks/usePatients.ts
import { useState, useCallback, useEffect } from 'react';
import { Patient, PatientSummary } from '../types';
import * as patientService from '../services/patientService';
import { useToast } from '../contexts/ToastContext';

interface UsePatientsResult {
  patients: PatientSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  fetchInitialPatients: (filters: { searchTerm: string; statusFilter: string }) => void;
  fetchMorePatients: () => void;
  addPatient: (patientData: Omit<Patient, 'id' | 'lastVisit'>) => Promise<void>;
}

export const usePatients = (): UsePatientsResult => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilters, setCurrentFilters] = useState({ searchTerm: '', statusFilter: 'All' });

  const { showToast } = useToast();

  const fetchPatients = useCallback(async (filters: { searchTerm: string; statusFilter: string }, cursor?: string | null) => {
    if (cursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setPatients([]); // Limpa a lista para novos filtros
    }
    setError(null);
    try {
      const result = await patientService.getPatients({ ...filters, cursor, limit: 15 });
      setPatients(prev => cursor ? [...prev, ...result.patients] : result.patients);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      setError(err as Error);
      showToast('Falha ao carregar pacientes.', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [showToast]);

  const fetchInitialPatients = useCallback((filters: { searchTerm: string; statusFilter: string }) => {
    setCurrentFilters(filters);
    fetchPatients(filters);
  }, [fetchPatients]);

  const fetchMorePatients = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchPatients(currentFilters, nextCursor);
  }, [isLoadingMore, hasMore, nextCursor, fetchPatients, currentFilters]);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
    try {
      await patientService.addPatient(patientData);
      showToast("Paciente adicionado com sucesso!", "success");
      // Recarrega a lista para mostrar o novo paciente (se corresponder aos filtros)
      fetchInitialPatients(currentFilters);
    } catch (err) {
      showToast("Falha ao adicionar paciente.", "error");
    }
  };
  
  // Apenas a busca inicial, as outras são acionadas por filtros ou scroll
  useEffect(() => {
    fetchInitialPatients({ searchTerm: '', statusFilter: 'All' });
  }, [fetchInitialPatients]);

  return {
    patients,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchInitialPatients,
    fetchMorePatients,
    addPatient,
  };
};