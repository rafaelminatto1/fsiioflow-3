'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Grid3X3, 
  List, 
  Download,
  Star,
  Target,
  Dumbbell
} from 'lucide-react'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseModal } from './ExerciseModal'
import { ExerciseForm } from './ExerciseForm'
import { useExercises } from '../hooks/useExercises'
import { Exercise, CreateExerciseInput } from '@/types/prisma'
import { EXERCISE_CATEGORIES, EXERCISE_CATEGORY_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

interface ExerciseLibraryProps {
  selectionMode?: boolean
  selectedExercises?: Exercise[]
  onExerciseSelect?: (exercise: Exercise) => void
  onExerciseDeselect?: (exercise: Exercise) => void
  onAddToPrescription?: (exercise: Exercise) => void
  showActions?: boolean
}

export function ExerciseLibrary({
  selectionMode = false,
  selectedExercises = [],
  onExerciseSelect,
  onExerciseDeselect,
  onAddToPrescription,
  showActions = true
}: ExerciseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    equipment: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'popular'>('name')
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

  const {
    exercises,
    isLoading,
    error,
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    getExercisesByCategory,
    getPopularExercises,
    searchExercises
  } = useExercises()

  // Buscar exercícios quando filtros mudarem
  useEffect(() => {
    const searchFilters = {
      search: searchTerm,
      category: filters.category as keyof typeof EXERCISE_CATEGORIES || undefined,
      difficulty: filters.difficulty ? parseInt(filters.difficulty) : undefined
    }
    
    const debounceTimer = setTimeout(() => {
      searchExercises(searchFilters)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, filters, searchExercises])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExerciseView = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setShowExerciseModal(true)
  }

  const handleExerciseEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setShowExerciseForm(true)
  }

  const handleExerciseDelete = async (exercise: Exercise) => {
    if (!confirm(`Tem certeza que deseja excluir o exercício "${exercise.name}"?`)) {
      return
    }

    try {
      await deleteExercise(exercise.id)
    } catch (error) {
      console.error('Erro ao excluir exercício:', error)
    }
  }

  const handleNewExercise = () => {
    setEditingExercise(null)
    setShowExerciseForm(true)
  }

  const handleSaveExercise = async (data: CreateExerciseInput) => {
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, data)
      } else {
        await createExercise(data)
      }
      setShowExerciseForm(false)
      setEditingExercise(null)
    } catch (error) {
      console.error('Erro ao salvar exercício:', error)
    }
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    if (selectionMode) {
      const isSelected = selectedExercises.some(e => e.id === exercise.id)
      if (isSelected) {
        onExerciseDeselect?.(exercise)
      } else {
        onExerciseSelect?.(exercise)
      }
    } else {
      handleExerciseView(exercise)
    }
  }

  const isExerciseSelected = (exercise: Exercise) => {
    return selectedExercises.some(e => e.id === exercise.id)
  }

  // Equipamentos únicos para filtro
  const uniqueEquipment = Array.from(
    new Set(exercises.flatMap(exercise => exercise.equipment))
  ).filter(Boolean)

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Erro ao carregar exercícios</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Exercícios</h2>
          <p className="text-gray-600">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} disponível{exercises.length !== 1 ? 'is' : ''}
          </p>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewExercise}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Exercício
            </button>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        {/* Barra de busca */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar exercícios por nome, categoria ou equipamento..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center px-3 py-2 border rounded-md transition-colors",
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'grid'
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 border-l border-gray-300 transition-colors",
                viewMode === 'list'
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                {Object.entries(EXERCISE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dificuldade
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                <option value="1">Muito Fácil</option>
                <option value="2">Fácil</option>
                <option value="3">Moderado</option>
                <option value="4">Difícil</option>
                <option value="5">Muito Difícil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipamento
              </label>
              <select
                value={filters.equipment}
                onChange={(e) => handleFilterChange('equipment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                {uniqueEquipment.map((equipment) => (
                  <option key={equipment} value={equipment}>{equipment}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="name">Nome</option>
                <option value="difficulty">Dificuldade</option>
                <option value="popular">Popularidade</option>
              </select>
            </div>
          </div>
        )}

        {/* Seleção (se em modo de seleção) */}
        {selectionMode && selectedExercises.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-blue-900">
              {selectedExercises.length} exercício{selectedExercises.length !== 1 ? 's' : ''} selecionado{selectedExercises.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={() => selectedExercises.forEach(exercise => onExerciseDeselect?.(exercise))}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Limpar seleção
            </button>
          </div>
        )}
      </div>

      {/* Lista de Exercícios */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando exercícios...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-8 text-center">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum exercício encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm || Object.values(filters).some(v => v)
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando um novo exercício'}
            </p>
          </div>
        ) : (
          <div className={cn(
            "p-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onView={handleExerciseView}
                onEdit={showActions ? handleExerciseEdit : undefined}
                onDelete={showActions ? handleExerciseDelete : undefined}
                onAddToPrescription={onAddToPrescription}
                showActions={showActions}
                isSelected={isExerciseSelected(exercise)}
                onSelect={selectionMode ? handleExerciseSelect : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showExerciseModal && selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          isOpen={showExerciseModal}
          onClose={() => {
            setShowExerciseModal(false)
            setSelectedExercise(null)
          }}
          onEdit={showActions ? () => {
            setShowExerciseModal(false)
            handleExerciseEdit(selectedExercise)
          } : undefined}
          onAddToPrescription={onAddToPrescription}
        />
      )}

      {/* Formulário de Exercício */}
      {showExerciseForm && (
        <ExerciseForm
          exercise={editingExercise || undefined}
          isOpen={showExerciseForm}
          onClose={() => {
            setShowExerciseForm(false)
            setEditingExercise(null)
          }}
          onSave={handleSaveExercise}
        />
      )}
    </div>
  )
}
