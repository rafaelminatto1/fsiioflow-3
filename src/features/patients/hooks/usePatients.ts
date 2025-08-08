import { useState, useEffect, useCallback } from 'react'
import { PatientWithDetails, CreatePatientInput, UpdatePatientInput, PatientFilters } from '@/types/prisma'

interface PatientsState {
  patients: PatientWithDetails[]
  isLoading: boolean
  error: string | null
  total: number
  currentPage: number
  pageSize: number
}

export function usePatients(initialFilters?: PatientFilters) {
  const [state, setState] = useState<PatientsState>({
    patients: [],
    isLoading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 20
  })

  const [filters, setFilters] = useState<PatientFilters>(initialFilters || {})

  // Buscar pacientes
  const fetchPatients = useCallback(async (newFilters?: PatientFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const searchParams = new URLSearchParams()
      const currentFilters = { ...filters, ...newFilters }
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/patients?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pacientes')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        patients: data.patients,
        total: data.total,
        currentPage: data.currentPage,
        pageSize: data.pageSize,
        isLoading: false
      }))

      if (newFilters) {
        setFilters(currentFilters)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }))
    }
  }, [filters])

  // Buscar paciente por ID
  const getPatientById = useCallback(async (id: string): Promise<PatientWithDetails | null> => {
    try {
      const response = await fetch(`/api/patients/${id}`)
      
      if (!response.ok) {
        throw new Error('Paciente não encontrado')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar paciente:', error)
      return null
    }
  }, [])

  // Criar paciente
  const createPatient = useCallback(async (data: CreatePatientInput) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar paciente')
      }

      const newPatient = await response.json()
      
      setState(prev => ({
        ...prev,
        patients: [newPatient, ...prev.patients],
        total: prev.total + 1,
        isLoading: false
      }))

      return { success: true, patient: newPatient }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Atualizar paciente
  const updatePatient = useCallback(async (id: string, data: UpdatePatientInput) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar paciente')
      }

      const updatedPatient = await response.json()
      
      setState(prev => ({
        ...prev,
        patients: prev.patients.map(p => p.id === id ? updatedPatient : p),
        isLoading: false
      }))

      return { success: true, patient: updatedPatient }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Deletar paciente (soft delete)
  const deletePatient = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao deletar paciente')
      }

      setState(prev => ({
        ...prev,
        patients: prev.patients.filter(p => p.id !== id),
        total: prev.total - 1,
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Buscar com filtros
  const searchPatients = useCallback((searchFilters: PatientFilters) => {
    fetchPatients(searchFilters)
  }, [fetchPatients])

  // Paginação
  const goToPage = useCallback((page: number) => {
    fetchPatients({ ...filters, offset: (page - 1) * state.pageSize })
  }, [fetchPatients, filters, state.pageSize])

  const changePageSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size }))
    fetchPatients({ ...filters, limit: size, offset: 0 })
  }, [fetchPatients, filters])

  // Carregar dados iniciais
  useEffect(() => {
    fetchPatients()
  }, []) // Executa apenas uma vez ao montar

  return {
    ...state,
    filters,
    fetchPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    goToPage,
    changePageSize,
    setFilters
  }
}
