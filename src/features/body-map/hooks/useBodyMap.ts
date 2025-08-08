import { useState, useEffect, useCallback } from 'react'
import { BodyMap, CreateBodyMapInput, PainPoint, PainEvolution } from '@/types/prisma'
import { coordinatesToPoint, pointToCoordinates, getPainColorByIntensity } from '@/lib/utils'

interface BodyMapState {
  painPoints: BodyMap[]
  isLoading: boolean
  error: string | null
}

interface BodyMapFilters {
  patientId?: string
  startDate?: Date
  endDate?: Date
  minIntensity?: number
  maxIntensity?: number
  bodyPart?: string
  side?: 'FRONT' | 'BACK'
}

export function useBodyMap(patientId?: string) {
  const [state, setState] = useState<BodyMapState>({
    painPoints: [],
    isLoading: false,
    error: null
  })

  // Buscar pontos de dor
  const fetchPainPoints = useCallback(async (filters?: BodyMapFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const searchParams = new URLSearchParams()
      const currentFilters = { patientId, ...filters }
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/body-map?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pontos de dor')
      }

      const painPoints = await response.json()
      
      setState(prev => ({
        ...prev,
        painPoints,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }))
    }
  }, [patientId])

  // Adicionar ponto de dor
  const addPainPoint = useCallback(async (data: Omit<CreateBodyMapInput, 'patientId' | 'coordinates'> & {
    x: number
    y: number
  }) => {
    if (!patientId) {
      throw new Error('ID do paciente é obrigatório')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const painPointData: CreateBodyMapInput = {
        ...data,
        patientId,
        coordinates: coordinatesToPoint(data.x, data.y)
      }

      const response = await fetch('/api/body-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(painPointData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao adicionar ponto de dor')
      }

      const newPainPoint = await response.json()
      
      setState(prev => ({
        ...prev,
        painPoints: [...prev.painPoints, newPainPoint],
        isLoading: false
      }))

      return { success: true, painPoint: newPainPoint }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [patientId])

  // Atualizar ponto de dor
  const updatePainPoint = useCallback(async (id: string, data: Partial<CreateBodyMapInput>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/body-map/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar ponto de dor')
      }

      const updatedPainPoint = await response.json()
      
      setState(prev => ({
        ...prev,
        painPoints: prev.painPoints.map(p => p.id === id ? updatedPainPoint : p),
        isLoading: false
      }))

      return { success: true, painPoint: updatedPainPoint }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Deletar ponto de dor
  const deletePainPoint = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(`/api/body-map/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao deletar ponto de dor')
      }

      setState(prev => ({
        ...prev,
        painPoints: prev.painPoints.filter(p => p.id !== id),
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

  // Buscar evolução da dor
  const getPainEvolution = useCallback(async (days: number = 30): Promise<PainEvolution[]> => {
    if (!patientId) return []

    try {
      const response = await fetch(`/api/body-map/evolution?patientId=${patientId}&days=${days}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar evolução da dor')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar evolução da dor:', error)
      return []
    }
  }, [patientId])

  // Buscar pontos de dor mais comuns
  const getCommonPainPoints = useCallback(async () => {
    try {
      const response = await fetch('/api/body-map/common-points')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pontos comuns de dor')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar pontos comuns de dor:', error)
      return []
    }
  }, [])

  // Converter pontos de dor para formato de visualização
  const getPainPointsForVisualization = useCallback((side: 'FRONT' | 'BACK') => {
    return state.painPoints
      .filter(point => point.side === side)
      .map(point => {
        const coordinates = pointToCoordinates(point.coordinates)
        return {
          id: point.id,
          x: coordinates.x,
          y: coordinates.y,
          intensity: point.intensity,
          painType: point.painType,
          bodyPart: point.bodyPart,
          description: point.description,
          notes: point.notes,
          date: new Date(point.recordedAt),
          color: getPainColorByIntensity(point.intensity)
        } as PainPoint
      })
  }, [state.painPoints])

  // Calcular estatísticas de dor
  const getPainStatistics = useCallback(() => {
    if (state.painPoints.length === 0) {
      return {
        averageIntensity: 0,
        totalPoints: 0,
        mostCommonBodyPart: null,
        mostCommonPainType: null,
        painTrend: 'stable' as 'improving' | 'worsening' | 'stable'
      }
    }

    const totalPoints = state.painPoints.length
    const averageIntensity = state.painPoints.reduce((sum, point) => sum + point.intensity, 0) / totalPoints

    // Parte do corpo mais comum
    const bodyPartCounts = state.painPoints.reduce((acc, point) => {
      acc[point.bodyPart] = (acc[point.bodyPart] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostCommonBodyPart = Object.keys(bodyPartCounts).reduce((a, b) => 
      bodyPartCounts[a] > bodyPartCounts[b] ? a : b
    )

    // Tipo de dor mais comum
    const painTypeCounts = state.painPoints.reduce((acc, point) => {
      acc[point.painType] = (acc[point.painType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostCommonPainType = Object.keys(painTypeCounts).reduce((a, b) => 
      painTypeCounts[a] > painTypeCounts[b] ? a : b
    )

    // Tendência da dor (comparar últimos 7 dias com 7 dias anteriores)
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentPoints = state.painPoints.filter(point => 
      new Date(point.recordedAt) >= sevenDaysAgo
    )
    const previousPoints = state.painPoints.filter(point => {
      const date = new Date(point.recordedAt)
      return date >= fourteenDaysAgo && date < sevenDaysAgo
    })

    const recentAverage = recentPoints.length > 0 
      ? recentPoints.reduce((sum, point) => sum + point.intensity, 0) / recentPoints.length 
      : 0
    const previousAverage = previousPoints.length > 0 
      ? previousPoints.reduce((sum, point) => sum + point.intensity, 0) / previousPoints.length 
      : 0

    let painTrend: 'improving' | 'worsening' | 'stable' = 'stable'
    if (recentAverage < previousAverage - 0.5) {
      painTrend = 'improving'
    } else if (recentAverage > previousAverage + 0.5) {
      painTrend = 'worsening'
    }

    return {
      averageIntensity: Math.round(averageIntensity * 10) / 10,
      totalPoints,
      mostCommonBodyPart,
      mostCommonPainType,
      painTrend
    }
  }, [state.painPoints])

  // Carregar dados iniciais
  useEffect(() => {
    if (patientId) {
      fetchPainPoints()
    }
  }, [patientId, fetchPainPoints])

  return {
    ...state,
    fetchPainPoints,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
    getPainEvolution,
    getCommonPainPoints,
    getPainPointsForVisualization,
    getPainStatistics
  }
}

// Hook para comparação de mapas corporais
export function useBodyMapComparison() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compareBodyMaps = useCallback(async (
    patientId: string,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/body-map/compare', {
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
        throw new Error('Erro ao comparar mapas corporais')
      }

      return await response.json()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    compareBodyMaps,
    isLoading,
    error
  }
}
