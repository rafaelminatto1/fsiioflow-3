import { useState, useEffect, useCallback } from 'react'
import { DashboardMetrics, ChartData } from '@/types/prisma'

interface DashboardState {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
}

interface DashboardFilters {
  clinicId?: string
  physiotherapistId?: string
  startDate?: Date
  endDate?: Date
  period?: 'week' | 'month' | 'quarter' | 'year'
}

export function useDashboard(initialFilters?: DashboardFilters) {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    isLoading: false,
    error: null
  })

  const [filters, setFilters] = useState<DashboardFilters>(initialFilters || {
    period: 'month'
  })

  // Buscar métricas do dashboard
  const fetchMetrics = useCallback(async (newFilters?: DashboardFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const searchParams = new URLSearchParams()
      const currentFilters = { ...filters, ...newFilters }
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            searchParams.append(key, value.toISOString())
          } else {
            searchParams.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/dashboard/metrics?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar métricas do dashboard')
      }

      const metrics = await response.json()
      
      setState(prev => ({
        ...prev,
        metrics,
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

  // Buscar dados para gráfico de evolução da dor
  const getPainEvolutionChart = useCallback(async (period: string = 'month'): Promise<ChartData | null> => {
    try {
      const response = await fetch(`/api/dashboard/pain-evolution?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de evolução da dor')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar evolução da dor:', error)
      return null
    }
  }, [])

  // Buscar dados para gráfico de sessões por mês
  const getSessionsChart = useCallback(async (period: string = 'month'): Promise<ChartData | null> => {
    try {
      const response = await fetch(`/api/dashboard/sessions-chart?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de sessões')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar dados de sessões:', error)
      return null
    }
  }, [])

  // Buscar dados para gráfico de distribuição de exercícios
  const getExercisesDistributionChart = useCallback(async (): Promise<ChartData | null> => {
    try {
      const response = await fetch('/api/dashboard/exercises-distribution')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar distribuição de exercícios')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar distribuição de exercícios:', error)
      return null
    }
  }, [])

  // Buscar dados para gráfico de aderência
  const getAdherenceChart = useCallback(async (): Promise<ChartData | null> => {
    try {
      const response = await fetch('/api/dashboard/adherence-chart')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de aderência')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar dados de aderência:', error)
      return null
    }
  }, [])

  // Buscar mapa de calor de pontos de dor
  const getPainHeatmapData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/pain-heatmap')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar mapa de calor')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar mapa de calor:', error)
      return []
    }
  }, [])

  // Buscar pacientes recentes
  const getRecentPatients = useCallback(async (limit: number = 5) => {
    try {
      const response = await fetch(`/api/dashboard/recent-patients?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pacientes recentes')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar pacientes recentes:', error)
      return []
    }
  }, [])

  // Buscar próximos agendamentos
  const getUpcomingAppointments = useCallback(async (limit: number = 5) => {
    try {
      const response = await fetch(`/api/dashboard/upcoming-appointments?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar próximos agendamentos')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar próximos agendamentos:', error)
      return []
    }
  }, [])

  // Buscar alertas e notificações
  const getAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/alerts')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar alertas')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      return []
    }
  }, [])

  // Buscar estatísticas por fisioterapeuta
  const getPhysiotherapistStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/physiotherapist-stats')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas de fisioterapeutas')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar estatísticas de fisioterapeutas:', error)
      return []
    }
  }, [])

  // Comparar períodos
  const comparePeriods = useCallback(async (
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ) => {
    try {
      const response = await fetch('/api/dashboard/compare-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentStart: currentStart.toISOString(),
          currentEnd: currentEnd.toISOString(),
          previousStart: previousStart.toISOString(),
          previousEnd: previousEnd.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao comparar períodos')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao comparar períodos:', error)
      return null
    }
  }, [])

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    fetchMetrics(newFilters)
  }, [fetchMetrics])

  // Atualizar período
  const changePeriod = useCallback((period: 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    updateFilters({ period, startDate, endDate })
  }, [updateFilters])

  // Refresh dos dados
  const refreshData = useCallback(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Carregar dados iniciais
  useEffect(() => {
    fetchMetrics()
  }, []) // Executa apenas uma vez ao montar

  return {
    ...state,
    filters,
    fetchMetrics,
    getPainEvolutionChart,
    getSessionsChart,
    getExercisesDistributionChart,
    getAdherenceChart,
    getPainHeatmapData,
    getRecentPatients,
    getUpcomingAppointments,
    getAlerts,
    getPhysiotherapistStats,
    comparePeriods,
    updateFilters,
    changePeriod,
    refreshData
  }
}

// Hook para dashboard do paciente
export function usePatientDashboard(patientId: string) {
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatientMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/dashboard/patient/${patientId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar métricas do paciente')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  const getPatientPainEvolution = useCallback(async (days: number = 30) => {
    try {
      const response = await fetch(`/api/dashboard/patient/${patientId}/pain-evolution?days=${days}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar evolução da dor do paciente')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar evolução da dor:', error)
      return []
    }
  }, [patientId])

  const getPatientExerciseProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/patient/${patientId}/exercise-progress`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar progresso dos exercícios')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar progresso dos exercícios:', error)
      return []
    }
  }, [patientId])

  useEffect(() => {
    if (patientId) {
      fetchPatientMetrics()
    }
  }, [patientId, fetchPatientMetrics])

  return {
    metrics,
    isLoading,
    error,
    fetchPatientMetrics,
    getPatientPainEvolution,
    getPatientExerciseProgress
  }
}
