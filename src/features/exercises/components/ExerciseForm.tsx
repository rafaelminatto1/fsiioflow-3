'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Upload, Plus, Minus } from 'lucide-react'
import { Exercise, CreateExerciseInput } from '@/types/prisma'
import { EXERCISE_CATEGORIES, EXERCISE_CATEGORY_LABELS, EXERCISE_DIFFICULTY_LABELS } from '@/constants'
import { validateAndSanitize, createExerciseSchema } from '@/lib/validations'
import { cn } from '@/lib/utils'

interface ExerciseFormProps {
  exercise?: Exercise
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateExerciseInput) => Promise<void>
}

export function ExerciseForm({ exercise, isOpen, onClose, onSave }: ExerciseFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'FORTALECIMENTO' as keyof typeof EXERCISE_CATEGORIES,
    description: '',
    instructions: '',
    videoUrl: '',
    imageUrl: '',
    defaultSets: 3,
    defaultReps: '10-15',
    defaultRest: 60,
    indications: [''],
    contraindications: [''],
    equipment: [''],
    difficulty: 3
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name,
        category: exercise.category,
        description: exercise.description,
        instructions: exercise.instructions,
        videoUrl: exercise.videoUrl || '',
        imageUrl: exercise.imageUrl || '',
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
        defaultRest: exercise.defaultRest,
        indications: exercise.indications.length > 0 ? exercise.indications : [''],
        contraindications: exercise.contraindications.length > 0 ? exercise.contraindications : [''],
        equipment: exercise.equipment.length > 0 ? exercise.equipment : [''],
        difficulty: exercise.difficulty
      })
    }
  }, [exercise])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleArrayInputChange = (field: 'indications' | 'contraindications' | 'equipment', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'indications' | 'contraindications' | 'equipment') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'indications' | 'contraindications' | 'equipment', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instruções são obrigatórias'
    }

    if (formData.defaultSets < 1) {
      newErrors.defaultSets = 'Séries deve ser maior que 0'
    }

    if (!formData.defaultReps.trim()) {
      newErrors.defaultReps = 'Repetições são obrigatórias'
    }

    if (formData.defaultRest < 0) {
      newErrors.defaultRest = 'Descanso não pode ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const submitData: CreateExerciseInput = {
        ...formData,
        indications: formData.indications.filter(item => item.trim()),
        contraindications: formData.contraindications.filter(item => item.trim()),
        equipment: formData.equipment.filter(item => item.trim())
      }

      await onSave(submitData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar exercício:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {exercise ? 'Editar Exercício' : 'Novo Exercício'}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                    errors.name ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(EXERCISE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                  errors.description ? "border-red-300" : "border-gray-300"
                )}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Instruções */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruções de Execução *
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={4}
                className={cn(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                  errors.instructions ? "border-red-300" : "border-gray-300"
                )}
              />
              {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>}
            </div>

            {/* Mídia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Vídeo
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Parâmetros */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parâmetros Padrão</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Séries
                  </label>
                  <input
                    type="number"
                    name="defaultSets"
                    value={formData.defaultSets}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repetições
                  </label>
                  <input
                    type="text"
                    name="defaultReps"
                    value={formData.defaultReps}
                    onChange={handleInputChange}
                    placeholder="10-15 ou 30s"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descanso (segundos)
                  </label>
                  <input
                    type="number"
                    name="defaultRest"
                    value={formData.defaultRest}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dificuldade
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(EXERCISE_DIFFICULTY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Arrays dinâmicos */}
            <div className="space-y-6">
              {/* Equipamentos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipamentos Necessários
                </label>
                {formData.equipment.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayInputChange('equipment', index, e.target.value)}
                      placeholder="Nome do equipamento"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('equipment', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('equipment')}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar equipamento
                </button>
              </div>

              {/* Indicações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indicações
                </label>
                {formData.indications.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayInputChange('indications', index, e.target.value)}
                      placeholder="Indicação para uso do exercício"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('indications', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('indications')}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar indicação
                </button>
              </div>

              {/* Contraindicações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraindicações
                </label>
                {formData.contraindications.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayInputChange('contraindications', index, e.target.value)}
                      placeholder="Contraindicação para uso do exercício"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('contraindications', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('contraindications')}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar contraindicação
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
