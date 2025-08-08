import { useState, useEffect, useCallback } from 'react'
import { SessionWithDetails, CreateSessionInput, SessionFilters } from '@/types/prisma'

interface SessionsState {
  sessions: SessionWithDetails[]
  isLoading: boolean
  error: string | null
  total: number
  currentPage: number
  pageSize: number
}

export function useSessions(initialFilters?: SessionFilters) {
  const [state, setState] = useState<SessionsState>({
    sessions: [],
    isLoading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 20
  })

  const [filters, setFilters] = useState<SessionFilters>(initialFilters || {})

  // Buscar sessões
  const fetchSessions = useCallback(async (newFilters?: SessionFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const searchParams = new URLSearchParams()
      const currentFilters = { ...filters, ...newFilters }
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/sessions?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar sessões')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        sessions: data.sessions,
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

  // Buscar sessão por ID
  const getSessionById = useCallback(async (id: string): Promise<SessionWithDetails | null> => {
    try {
      const response = await fetch(`/api/sessions/${id}`)
      
      if (!response.ok) {
        throw new Error('Sessão não encontrada')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      return null
    }
  }, [])

  // Criar sessão
  const createSession = useCallback(async (data: CreateSessionInput) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar sessão')
      }

      const newSession = await response.json()
      
      setState(prev => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        total: prev.total + 1,
        isLoading: false
      }))

      return { success: true, session: newSession }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Atualizar sessão
  const updateSession = useCallback(async (id: string, data: Partial<CreateSessionInput>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar sessão')
      }

      const updatedSession = await response.json()
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === id ? updatedSession : s),
        isLoading: false
      }))

      return { success: true, session: updatedSession }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Buscar sessões do paciente
  const getPatientSessions = useCallback(async (patientId: string) => {
    return fetchSessions({ patientId })
  }, [fetchSessions])

  // Buscar sessões do fisioterapeuta
  const getPhysiotherapistSessions = useCallback(async (physiotherapistId: string) => {
    return fetchSessions({ physiotherapistId })
  }, [fetchSessions])

  // Buscar próxima sessão do paciente
  const getNextPatientSession = useCallback(async (patientId: string): Promise<SessionWithDetails | null> => {
    try {
      const response = await fetch(`/api/sessions/next?patientId=${patientId}`)
      
      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar próxima sessão:', error)
      return null
    }
  }, [])

  // Calcular estatísticas das sessões
  const getSessionStatistics = useCallback((patientId?: string) => {
    let sessionsToAnalyze = state.sessions
    
    if (patientId) {
      sessionsToAnalyze = state.sessions.filter(s => s.patientId === patientId)
    }

    if (sessionsToAnalyze.length === 0) {
      return {
        totalSessions: 0,
        averagePainReduction: 0,
        completedObjectives: 0,
        averageSessionDuration: 0,
        mostUsedTechniques: [],
        painTrend: 'stable' as 'improving' | 'worsening' | 'stable'
      }
    }

    const totalSessions = sessionsToAnalyze.length

    // Redução média da dor
    const sessionsWithPainData = sessionsToAnalyze.filter(s => 
      s.painBefore !== null && s.painAfter !== null
    )
    const averagePainReduction = sessionsWithPainData.length > 0
      ? sessionsWithPainData.reduce((sum, s) => 
          sum + (s.painBefore! - s.painAfter!), 0
        ) / sessionsWithPainData.length
      : 0

    // Técnicas mais utilizadas
    const techniqueCount: Record<string, number> = {}
    sessionsToAnalyze.forEach(session => {
      session.techniques.forEach(technique => {
        techniqueCount[technique] = (techniqueCount[technique] || 0) + 1
      })
    })
    const mostUsedTechniques = Object.entries(techniqueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([technique, count]) => ({ technique, count }))

    // Tendência da dor
    const recentSessions = sessionsToAnalyze
      .filter(s => s.painAfter !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    let painTrend: 'improving' | 'worsening' | 'stable' = 'stable'
    if (recentSessions.length >= 3) {
      const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2))
      const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, s) => sum + (s.painAfter || 0), 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, s) => sum + (s.painAfter || 0), 0) / secondHalf.length
      
      if (firstAvg < secondAvg - 0.5) {
        painTrend = 'improving'
      } else if (firstAvg > secondAvg + 0.5) {
        painTrend = 'worsening'
      }
    }

    return {
      totalSessions,
      averagePainReduction: Math.round(averagePainReduction * 10) / 10,
      completedObjectives: 0, // Implementar lógica de objetivos completados
      averageSessionDuration: 60, // Implementar cálculo de duração média
      mostUsedTechniques,
      painTrend
    }
  }, [state.sessions])

  // Gerar relatório de evolução
  const generateEvolutionReport = useCallback(async (patientId: string, startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/sessions/evolution-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório de evolução')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      return null
    }
  }, [])

  // Paginação
  const goToPage = useCallback((page: number) => {
    fetchSessions({ ...filters, offset: (page - 1) * state.pageSize })
  }, [fetchSessions, filters, state.pageSize])

  const changePageSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size }))
    fetchSessions({ ...filters, limit: size, offset: 0 })
  }, [fetchSessions, filters])

  // Buscar com filtros
  const searchSessions = useCallback((searchFilters: SessionFilters) => {
    fetchSessions(searchFilters)
  }, [fetchSessions])

  // Carregar dados iniciais
  useEffect(() => {
    fetchSessions()
  }, []) // Executa apenas uma vez ao montar

  return {
    ...state,
    filters,
    fetchSessions,
    getSessionById,
    createSession,
    updateSession,
    getPatientSessions,
    getPhysiotherapistSessions,
    getNextPatientSession,
    getSessionStatistics,
    generateEvolutionReport,
    searchSessions,
    goToPage,
    changePageSize,
    setFilters
  }
}

// Hook para template de sessão
export function useSessionTemplate() {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const getSessionTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/sessions/templates')
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSessionFromTemplate = useCallback(async (templateId: string, sessionData: Partial<CreateSessionInput>) => {
    try {
      const response = await fetch('/api/sessions/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          ...sessionData
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar sessão a partir do template')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao criar sessão do template:', error)
      return null
    }
  }, [])

  useEffect(() => {
    getSessionTemplates()
  }, [getSessionTemplates])

  return {
    templates,
    isLoading,
    getSessionTemplates,
    createSessionFromTemplate
  }
}
