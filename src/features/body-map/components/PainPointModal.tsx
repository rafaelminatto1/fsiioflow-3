'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { CreateBodyMapInput, PainPoint } from '@/types/prisma'
import { PAIN_TYPES, PAIN_TYPE_LABELS, BODY_SIDES, BODY_SIDE_LABELS } from '@/constants'
import { getPainColorByIntensity, getPainLabelByIntensity } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PainPointModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateBodyMapInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  painPoint?: PainPoint
  coordinates?: { x: number; y: number }
  side: 'FRONT' | 'BACK'
  patientId: string
}

export function PainPointModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  painPoint,
  coordinates,
  side,
  patientId
}: PainPointModalProps) {
  const [formData, setFormData] = useState({
    intensity: 5,
    painType: 'DOR' as keyof typeof PAIN_TYPES,
    bodyPart: '',
    description: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Preencher formulário quando há um ponto existente
  useEffect(() => {
    if (painPoint) {
      setFormData({
        intensity: painPoint.intensity,
        painType: painPoint.painType as keyof typeof PAIN_TYPES,
        bodyPart: painPoint.bodyPart,
        description: painPoint.description || '',
        notes: painPoint.notes || ''
      })
    } else {
      setFormData({
        intensity: 5,
        painType: 'DOR',
        bodyPart: '',
        description: '',
        notes: ''
      })
    }
  }, [painPoint])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleIntensityChange = (intensity: number) => {
    setFormData(prev => ({ ...prev, intensity }))
    if (errors.intensity) {
      setErrors(prev => ({ ...prev, intensity: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bodyPart.trim()) {
      newErrors.bodyPart = 'Parte do corpo é obrigatória'
    }

    if (formData.intensity < 0 || formData.intensity > 10) {
      newErrors.intensity = 'Intensidade deve estar entre 0 e 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const saveData: CreateBodyMapInput = {
        patientId,
        coordinates: '', // Será preenchido pelo hook
        x: coordinates?.x || painPoint?.x || 50,
        y: coordinates?.y || painPoint?.y || 50,
        intensity: formData.intensity,
        painType: formData.painType,
        side,
        bodyPart: formData.bodyPart,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
        recordedAt: new Date()
      }

      await onSave(saveData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar ponto de dor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!painPoint?.id || !onDelete) return

    if (!confirm('Tem certeza que deseja excluir este ponto de dor?')) return

    setIsLoading(true)
    try {
      await onDelete(painPoint.id)
      onClose()
    } catch (error) {
      console.error('Erro ao excluir ponto de dor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {painPoint ? 'Editar Ponto de Dor' : 'Adicionar Ponto de Dor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Intensidade da Dor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intensidade da Dor
            </label>
            <div className="space-y-3">
              {/* Slider */}
              <input
                type="range"
                min="0"
                max="10"
                value={formData.intensity}
                onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${getPainColorByIntensity(0)} 0%, ${getPainColorByIntensity(formData.intensity)} ${formData.intensity * 10}%, #e5e7eb ${formData.intensity * 10}%)`
                }}
              />
              
              {/* Indicador visual */}
              <div className="flex items-center justify-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: getPainColorByIntensity(formData.intensity) }}
                >
                  {formData.intensity}
                </div>
                <span className="text-sm text-gray-600">
                  {getPainLabelByIntensity(formData.intensity)}
                </span>
              </div>

              {/* Escala numérica */}
              <div className="flex justify-between text-xs text-gray-500">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleIntensityChange(num)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      formData.intensity === num
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            {errors.intensity && (
              <p className="mt-1 text-sm text-red-600">{errors.intensity}</p>
            )}
          </div>

          {/* Tipo de Dor */}
          <div>
            <label htmlFor="painType" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Dor
            </label>
            <select
              id="painType"
              name="painType"
              value={formData.painType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(PAIN_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Parte do Corpo */}
          <div>
            <label htmlFor="bodyPart" className="block text-sm font-medium text-gray-700 mb-1">
              Parte do Corpo *
            </label>
            <input
              id="bodyPart"
              name="bodyPart"
              type="text"
              value={formData.bodyPart}
              onChange={handleInputChange}
              placeholder="Ex: Ombro direito, Lombar, Joelho esquerdo"
              className={cn(
                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                errors.bodyPart ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.bodyPart && (
              <p className="mt-1 text-sm text-red-600">{errors.bodyPart}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Dor
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              placeholder="Descreva as características da dor (queimação, pontada, latejante, etc.)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="Informações adicionais, fatores desencadeantes, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Informações de localização */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Localização</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Lado:</span> {BODY_SIDE_LABELS[side]}
              </div>
              <div>
                <span className="font-medium">Coordenadas:</span> 
                {coordinates ? ` (${coordinates.x.toFixed(1)}, ${coordinates.y.toFixed(1)})` : 
                 painPoint ? ` (${painPoint.x.toFixed(1)}, ${painPoint.y.toFixed(1)})` : ' -'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {painPoint && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
