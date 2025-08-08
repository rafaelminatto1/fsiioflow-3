import { useState, useEffect, useCallback } from 'react'
import { Exercise, PrescriptionWithExercises, CreateExerciseInput, CreatePrescriptionInput } from '@/types/prisma'
import { EXERCISE_CATEGORIES } from '@/constants'

interface ExercisesState {
  exercises: Exercise[]
  isLoading: boolean
  error: string | null
  total: number
  currentPage: number
  pageSize: number
}

interface ExerciseFilters {
  category?: keyof typeof EXERCISE_CATEGORIES
  difficulty?: number
  search?: string
  limit?: number
  offset?: number
}

export function useExercises(initialFilters?: ExerciseFilters) {
  const [state, setState] = useState<ExercisesState>({
    exercises: [],
    isLoading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 20
  })

  const [filters, setFilters] = useState<ExerciseFilters>(initialFilters || {})

  // Buscar exercícios
  const fetchExercises = useCallback(async (newFilters?: ExerciseFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const searchParams = new URLSearchParams()
      const currentFilters = { ...filters, ...newFilters }
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/exercises?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar exercícios')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        exercises: data.exercises,
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

  // Buscar exercício por ID
  const getExerciseById = useCallback(async (id: string): Promise<Exercise | null> => {
    try {
      const response = await fetch(`/api/exercises/${id}`)
      
      if (!response.ok) {
        throw new Error('Exercício não encontrado')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar exercício:', error)
      return null
    }
  }, [])

  // Criar exercício
  const createExercise = useCallback(async (data: CreateExerciseInput) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar exercício')
      }

      const newExercise = await response.json()
      
      setState(prev => ({
        ...prev,
        exercises: [newExercise, ...prev.exercises],
        total: prev.total + 1,
        isLoading: false
      }))

      return { success: true, exercise: newExercise }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Atualizar exercício
  const updateExercise = useCallback(async (id: string, data: Partial<CreateExerciseInput>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/exercises/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar exercício')
      }

      const updatedExercise = await response.json()
      
      setState(prev => ({
        ...prev,
        exercises: prev.exercises.map(e => e.id === id ? updatedExercise : e),
        isLoading: false
      }))

      return { success: true, exercise: updatedExercise }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Deletar exercício
  const deleteExercise = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao deletar exercício')
      }

      setState(prev => ({
        ...prev,
        exercises: prev.exercises.filter(e => e.id !== id),
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

  // Buscar por categoria
  const getExercisesByCategory = useCallback(async (category: keyof typeof EXERCISE_CATEGORIES) => {
    return fetchExercises({ category })
  }, [fetchExercises])

  // Buscar exercícios populares
  const getPopularExercises = useCallback(async (limit: number = 10) => {
    try {
      const response = await fetch(`/api/exercises/popular?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar exercícios populares')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar exercícios populares:', error)
      return []
    }
  }, [])

  // Paginação
  const goToPage = useCallback((page: number) => {
    fetchExercises({ ...filters, offset: (page - 1) * state.pageSize })
  }, [fetchExercises, filters, state.pageSize])

  const changePageSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size }))
    fetchExercises({ ...filters, limit: size, offset: 0 })
  }, [fetchExercises, filters])

  // Buscar com filtros
  const searchExercises = useCallback((searchFilters: ExerciseFilters) => {
    fetchExercises(searchFilters)
  }, [fetchExercises])

  // Carregar dados iniciais
  useEffect(() => {
    fetchExercises()
  }, []) // Executa apenas uma vez ao montar

  return {
    ...state,
    filters,
    fetchExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise,
    getExercisesByCategory,
    getPopularExercises,
    searchExercises,
    goToPage,
    changePageSize,
    setFilters
  }
}

// Hook para prescrições de exercícios
export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithExercises[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar prescrições do paciente
  const getPatientPrescriptions = useCallback(async (patientId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/prescriptions?patientId=${patientId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar prescrições')
      }

      const data = await response.json()
      setPrescriptions(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Criar prescrição
  const createPrescription = useCallback(async (data: CreatePrescriptionInput & {
    exercises: Array<{
      exerciseId: string
      sets: number
      reps: string
      rest: number
      specificNotes?: string
      order: number
    }>
  }) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar prescrição')
      }

      const newPrescription = await response.json()
      setPrescriptions(prev => [newPrescription, ...prev])

      return { success: true, prescription: newPrescription }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Atualizar status da prescrição
  const updatePrescriptionStatus = useCallback(async (
    id: string, 
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar prescrição')
      }

      const updatedPrescription = await response.json()
      setPrescriptions(prev => 
        prev.map(p => p.id === id ? updatedPrescription : p)
      )

      return { success: true, prescription: updatedPrescription }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    prescriptions,
    isLoading,
    error,
    getPatientPrescriptions,
    createPrescription,
    updatePrescriptionStatus
  }
}
