'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useBodyMap } from '../hooks/useBodyMap'
import { PainEvolution } from '@/types/prisma'
import { formatDate, getPainColorByIntensity } from '@/lib/utils'

interface PainTimelineProps {
  patientId: string
  days?: number
  className?: string
}

export function PainTimeline({ patientId, days = 30, className }: PainTimelineProps) {
  const [evolutionData, setEvolutionData] = useState<PainEvolution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(days)
  
  const { getPainEvolution } = useBodyMap(patientId)

  useEffect(() => {
    const loadEvolutionData = async () => {
      setIsLoading(true)
      try {
        const data = await getPainEvolution(selectedPeriod)
        setEvolutionData(data)
      } catch (error) {
        console.error('Erro ao carregar evolução:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (patientId) {
      loadEvolutionData()
    }
  }, [patientId, selectedPeriod, getPainEvolution])

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous - 0.5) {
      return <TrendingDown className="h-4 w-4 text-green-600" />
    } else if (current > previous + 0.5) {
      return <TrendingUp className="h-4 w-4 text-red-600" />
    }
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendLabel = (current: number, previous: number) => {
    if (current < previous - 0.5) {
      return 'Melhorou'
    } else if (current > previous + 0.5) {
      return 'Piorou'
    }
    return 'Estável'
  }

  const periodOptions = [
    { value: 7, label: '7 dias' },
    { value: 30, label: '30 dias' },
    { value: 90, label: '3 meses' },
    { value: 180, label: '6 meses' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white rounded-lg border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (evolutionData.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Nenhum dado de evolução
        </h3>
        <p className="text-gray-600">
          Adicione pontos de dor ao longo do tempo para visualizar a evolução.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Timeline de Evolução</h3>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Período:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        <div className="space-y-4">
          {evolutionData.map((evolution, index) => {
            const previousEvolution = evolutionData[index + 1]
            const isFirst = index === 0
            const isLast = index === evolutionData.length - 1

            return (
              <div key={evolution.date.toISOString()} className="flex items-start space-x-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  {/* Point */}
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ 
                      backgroundColor: getPainColorByIntensity(evolution.averageIntensity) 
                    }}
                  />
                  
                  {/* Line */}
                  {!isLast && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(evolution.date)}
                        </span>
                        
                        {previousEvolution && (
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(evolution.averageIntensity, previousEvolution.averageIntensity)}
                            <span className="text-xs text-gray-600">
                              {getTrendLabel(evolution.averageIntensity, previousEvolution.averageIntensity)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        {evolution.pointCount} ponto(s) registrado(s)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {evolution.averageIntensity.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Intensidade média
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>0</span>
                      <span>10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(evolution.averageIntensity / 10) * 100}%`,
                          backgroundColor: getPainColorByIntensity(evolution.averageIntensity)
                        }}
                      />
                    </div>
                  </div>

                  {/* Change indicator */}
                  {previousEvolution && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-600">Mudança:</span>
                        <span className={`font-medium ${
                          evolution.averageIntensity < previousEvolution.averageIntensity
                            ? 'text-green-600'
                            : evolution.averageIntensity > previousEvolution.averageIntensity
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          {evolution.averageIntensity > previousEvolution.averageIntensity ? '+' : ''}
                          {(evolution.averageIntensity - previousEvolution.averageIntensity).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {evolutionData.length > 1 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Resumo do Período</h4>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Intensidade Inicial</div>
                <div className="font-semibold text-gray-900">
                  {evolutionData[evolutionData.length - 1].averageIntensity.toFixed(1)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600">Intensidade Atual</div>
                <div className="font-semibold text-gray-900">
                  {evolutionData[0].averageIntensity.toFixed(1)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600">Variação Total</div>
                <div className={`font-semibold ${
                  evolutionData[0].averageIntensity < evolutionData[evolutionData.length - 1].averageIntensity
                    ? 'text-green-600'
                    : evolutionData[0].averageIntensity > evolutionData[evolutionData.length - 1].averageIntensity
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {evolutionData[0].averageIntensity > evolutionData[evolutionData.length - 1].averageIntensity ? '+' : ''}
                  {(evolutionData[0].averageIntensity - evolutionData[evolutionData.length - 1].averageIntensity).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
