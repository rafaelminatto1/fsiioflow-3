// components/medical/BodyMap/BodyMap.tsx - Main BodyMap component
import React, { useState, useCallback } from 'react';
import { Side } from '@prisma/client';
import { BodyMapSVG } from './BodyMapSVG';
import { PainTimeline } from './PainTimeline';
import { AddPainPointModal } from './AddPainPointModal';
import { BodyMapAnalytics } from './BodyMapAnalytics';
import { ExportToPDF } from './ExportToPDF';
import { useBodyMap, useResponsive } from '../../../hooks/useBodyMap';
import { PainPoint } from '../../../src/types/bodymap.types';

interface BodyMapProps {
  patientId: string;
  readonly?: boolean;
  showAnalytics?: boolean;
  showTimeline?: boolean;
  className?: string;
}

export function BodyMap({ 
  patientId, 
  readonly = false, 
  showAnalytics = true,
  showTimeline = true,
  className = '' 
}: BodyMapProps) {
  // Hooks
  const {
    painPoints,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
    refresh,
  } = useBodyMap(patientId);

  const screenSize = useResponsive();

  // Local state
  const [currentSide, setCurrentSide] = useState<Side>('FRONT');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number} | null>(null);
  const [editingPoint, setEditingPoint] = useState<PainPoint | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter points by current side
  const currentPainPoints = painPoints.filter(p => p.side === currentSide);

  // Handle SVG click to add new pain point
  const handleSVGClick = useCallback((x: number, y: number) => {
    if (readonly) return;
    
    setSelectedPoint({ x, y });
    setEditingPoint(null);
    setShowAddModal(true);
  }, [readonly]);

  // Handle pain point click to edit
  const handlePainPointClick = useCallback((point: PainPoint) => {
    if (readonly) return;
    
    setEditingPoint(point);
    setSelectedPoint(null);
    setShowAddModal(true);
  }, [readonly]);

  // Handle add new pain point
  const handleAddPainPoint = useCallback(async (data: Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addPainPoint({
        ...data,
        side: currentSide,
        patientId,
      });
      setShowAddModal(false);
      setSelectedPoint(null);
    } catch (error) {
      console.error('Erro ao adicionar ponto de dor:', error);
      // Em um app real, mostraria um toast de erro
    }
  }, [addPainPoint, currentSide, patientId]);

  // Handle update pain point
  const handleUpdatePainPoint = useCallback(async (id: string, updates: Partial<PainPoint>) => {
    try {
      await updatePainPoint(id, updates);
      setShowAddModal(false);
      setEditingPoint(null);
    } catch (error) {
      console.error('Erro ao atualizar ponto de dor:', error);
      // Em um app real, mostraria um toast de erro
    }
  }, [updatePainPoint]);

  // Handle delete pain point
  const handleDeletePainPoint = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ponto de dor?')) return;
    
    try {
      await deletePainPoint(id);
    } catch (error) {
      console.error('Erro ao deletar ponto de dor:', error);
      // Em um app real, mostraria um toast de erro
    }
  }, [deletePainPoint]);

  // Render loading state
  if (loading && painPoints.length === 0) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Carregando mapa corporal...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Erro ao carregar mapa corporal
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={refresh}
                className="bg-red-100 px-3 py-2 rounded text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';

  return (
    <div className={`body-map-container ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Mapa Corporal</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Side toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentSide === 'FRONT' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setCurrentSide('FRONT')}
            >
              Frente
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentSide === 'BACK' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setCurrentSide('BACK')}
            >
              Costas
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Main content layout - responsive */}
      <div className={`
        ${isMobile 
          ? 'flex flex-col space-y-6' 
          : isTablet 
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
            : 'grid grid-cols-3 gap-6'
        }
      `}>
        {/* SVG Container */}
        <div className={`
          ${isMobile ? 'order-1' : isTablet ? 'lg:col-span-2' : 'col-span-2'}
        `}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <BodyMapSVG
              side={currentSide}
              painPoints={currentPainPoints}
              onSVGClick={handleSVGClick}
              onPainPointClick={handlePainPointClick}
              readonly={readonly}
              className={`
                ${isMobile ? 'max-h-80' : isTablet ? 'max-h-96' : 'max-h-[500px]'}
              `}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'order-2' : ''} 
          space-y-6
        `}>
          {/* Timeline */}
          {showTimeline && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <PainTimeline
                patientId={patientId}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          )}

          {/* Pain scale legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Escala de Dor</h3>
            <div className="space-y-2">
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className={`w-4 h-4 rounded-full ${getPainColorClass(i)} shadow-sm`}
                  />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">{i}</span>
                    {i === 0 && " - Sem dor"}
                    {i >= 1 && i <= 3 && " - Dor leve"}
                    {i >= 4 && i <= 6 && " - Dor moderada"}
                    {i >= 7 && i <= 10 && " - Dor forte"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Estatísticas Atuais</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de pontos:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {currentPainPoints.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dor média:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {currentPainPoints.length > 0
                    ? ((currentPainPoints.reduce((sum, p) => sum + p.intensity, 0) / currentPainPoints.length)).toFixed(1)
                    : '0.0'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Região mais afetada:</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {getMostAffectedBodyPart(currentPainPoints) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics section - full width */}
      {showAnalytics && !isMobile && (
        <div className="mt-8">
          <BodyMapAnalytics patientId={patientId} />
        </div>
      )}

      {/* Modals */}
      {showAddModal && (selectedPoint || editingPoint) && (
        <AddPainPointModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPoint(null);
            setEditingPoint(null);
          }}
          onSave={editingPoint ? 
            (data) => handleUpdatePainPoint(editingPoint.id, data) :
            handleAddPainPoint
          }
          onDelete={editingPoint ? 
            () => handleDeletePainPoint(editingPoint.id) : 
            undefined
          }
          initialPosition={selectedPoint}
          editingPoint={editingPoint}
          side={currentSide}
          patientId={patientId}
        />
      )}

      {showExportModal && (
        <ExportToPDF
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          patientId={patientId}
          painPoints={painPoints}
        />
      )}
    </div>
  );
}

// Utility functions
function getPainColorClass(intensity: number): string {
  const colorClasses = [
    'bg-green-500',    // 0 - sem dor
    'bg-green-400',    // 1
    'bg-green-300',    // 2
    'bg-yellow-400',   // 3 - dor leve
    'bg-yellow-500',   // 4
    'bg-orange-500',   // 5 - dor moderada
    'bg-orange-600',   // 6
    'bg-red-500',      // 7 - dor forte
    'bg-red-600',      // 8
    'bg-red-700',      // 9
    'bg-red-800',      // 10 - dor máxima
  ];
  
  return colorClasses[intensity] || 'bg-gray-400';
}

function getMostAffectedBodyPart(points: PainPoint[]): string | null {
  if (points.length === 0) return null;

  const counts = new Map<string, number>();
  points.forEach(point => {
    const bodyPart = point.bodyPart.replace(/_/g, ' ');
    counts.set(bodyPart, (counts.get(bodyPart) || 0) + 1);
  });

  let maxCount = 0;
  let mostAffected = null;
  counts.forEach((count, bodyPart) => {
    if (count > maxCount) {
      maxCount = count;
      mostAffected = bodyPart;
    }
  });

  return mostAffected;
}