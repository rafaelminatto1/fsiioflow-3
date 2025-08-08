'use client'

import React, { useState, useEffect } from 'react'
import { RotateCcw, Download, Calendar, Filter, Plus } from 'lucide-react'
import { BodyMapSVG } from './BodyMapSVG'
import { PainPointModal } from './PainPointModal'
import { PainTimeline } from './PainTimeline'
import { useBodyMap } from '../hooks/useBodyMap'
import { PainPoint, CreateBodyMapInput } from '@/types/prisma'
import { BODY_SIDE_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

interface BodyMapProps {
  patientId: string
  isReadOnly?: boolean
  showTimeline?: boolean
  className?: string
}

export function BodyMap({ 
  patientId, 
  isReadOnly = false, 
  showTimeline = true,
  className 
}: BodyMapProps) {
  const [currentSide, setCurrentSide] = useState<'FRONT' | 'BACK'>('FRONT')
  const [selectedPoint, setSelectedPoint] = useState<PainPoint | null>(null)
  const [newPointCoordinates, setNewPointCoordinates] = useState<{ x: number; y: number } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    minIntensity: 0,
    maxIntensity: 10
  })

  const {
    painPoints,
    isLoading,
    error,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
    fetchPainPoints,
    getPainPointsForVisualization,
    getPainStatistics
  } = useBodyMap(patientId)

  // Carregar pontos de dor quando o componente montar
  useEffect(() => {
    if (patientId) {
      fetchPainPoints()
    }
  }, [patientId, fetchPainPoints])

  // Obter pontos para visualização no lado atual
  const currentSidePainPoints = getPainPointsForVisualization(currentSide)

  // Estatísticas de dor
  const painStats = getPainStatistics()

  const handleAddPoint = (x: number, y: number) => {
    if (isReadOnly) return
    
    setNewPointCoordinates({ x, y })
    setSelectedPoint(null)
    setIsModalOpen(true)
  }

  const handleEditPoint = (painPoint: PainPoint) => {
    if (isReadOnly) return
    
    setSelectedPoint(painPoint)
    setNewPointCoordinates(null)
    setIsModalOpen(true)
  }

  const handleSavePoint = async (data: CreateBodyMapInput) => {
    try {
      if (selectedPoint) {
        // Atualizar ponto existente
        await updatePainPoint(selectedPoint.id, data)
      } else {
        // Adicionar novo ponto
        await addPainPoint(data)
      }
      setIsModalOpen(false)
      setSelectedPoint(null)
      setNewPointCoordinates(null)
    } catch (error) {
      console.error('Erro ao salvar ponto:', error)
    }
  }

  const handleDeletePoint = async (id: string) => {
    try {
      await deletePainPoint(id)
      setIsModalOpen(false)
      setSelectedPoint(null)
    } catch (error) {
      console.error('Erro ao excluir ponto:', error)
    }
  }

  const handleExportPDF = async () => {
    // Implementar export para PDF
    console.log('Exportar para PDF')
  }

  const handleApplyFilters = () => {
    fetchPainPoints(filters)
  }

  const handleResetView = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      minIntensity: 0,
      maxIntensity: 10
    })
    fetchPainPoints()
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Erro ao carregar mapa corporal</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={() => fetchPainPoints()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mapa Corporal</h2>
          <p className="text-gray-600">
            {isReadOnly ? 'Visualização' : 'Clique no corpo para adicionar pontos de dor'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isReadOnly && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Ponto
            </button>
          )}
          
          <button
            onClick={handleResetView}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Resetar
          </button>
          
          <button
            onClick={handleExportPDF}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {painStats.totalPoints > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{painStats.totalPoints}</div>
            <div className="text-sm text-gray-600">Total de Pontos</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{painStats.averageIntensity}</div>
            <div className="text-sm text-gray-600">Intensidade Média</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900 capitalize">
              {painStats.mostCommonBodyPart || '-'}
            </div>
            <div className="text-sm text-gray-600">Região Mais Afetada</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className={cn(
              "text-2xl font-bold",
              painStats.painTrend === 'improving' ? 'text-green-600' :
              painStats.painTrend === 'worsening' ? 'text-red-600' :
              'text-gray-600'
            )}>
              {painStats.painTrend === 'improving' ? '↓ Melhorando' :
               painStats.painTrend === 'worsening' ? '↑ Piorando' :
               '→ Estável'}
            </div>
            <div className="text-sm text-gray-600">Tendência</div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          {/* Seletor de lado */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['FRONT', 'BACK'] as const).map((side) => (
              <button
                key={side}
                onClick={() => setCurrentSide(side)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  currentSide === side
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {BODY_SIDE_LABELS[side]}
              </button>
            ))}
          </div>

          {/* Contador de pontos */}
          <div className="text-sm text-gray-600">
            {currentSidePainPoints.length} ponto(s) no lado {BODY_SIDE_LABELS[currentSide].toLowerCase()}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Intensidade:</label>
            <input
              type="range"
              min="0"
              max="10"
              value={filters.minIntensity}
              onChange={(e) => setFilters(prev => ({ ...prev, minIntensity: parseInt(e.target.value) }))}
              className="w-16"
            />
            <span className="text-xs text-gray-500">{filters.minIntensity}</span>
            <span className="text-gray-400">-</span>
            <input
              type="range"
              min="0"
              max="10"
              value={filters.maxIntensity}
              onChange={(e) => setFilters(prev => ({ ...prev, maxIntensity: parseInt(e.target.value) }))}
              className="w-16"
            />
            <span className="text-xs text-gray-500">{filters.maxIntensity}</span>
          </div>

          <button
            onClick={handleApplyFilters}
            className="flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Mapa Corporal */}
      <div className="flex justify-center">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <BodyMapSVG
            side={currentSide}
            painPoints={currentSidePainPoints}
            onPointClick={handleAddPoint}
            onPainPointClick={handleEditPoint}
            isInteractive={!isReadOnly}
            width={400}
            height={600}
          />
        </div>
      </div>

      {/* Timeline de Evolução */}
      {showTimeline && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução da Dor</h3>
          <PainTimeline patientId={patientId} />
        </div>
      )}

      {/* Modal */}
      <PainPointModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPoint(null)
          setNewPointCoordinates(null)
        }}
        onSave={handleSavePoint}
        onDelete={selectedPoint ? handleDeletePoint : undefined}
        painPoint={selectedPoint || undefined}
        coordinates={newPointCoordinates || undefined}
        side={currentSide}
        patientId={patientId}
      />
    </div>
  )
}
