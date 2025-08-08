'use client'

import React, { useState } from 'react'
import { 
  Play, 
  Star, 
  Clock, 
  Users, 
  Target, 
  AlertTriangle,
  Heart,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { Exercise } from '@/types/prisma'
import { EXERCISE_CATEGORY_LABELS, EXERCISE_DIFFICULTY_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  onView?: (exercise: Exercise) => void
  onEdit?: (exercise: Exercise) => void
  onDelete?: (exercise: Exercise) => void
  onAddToPrescription?: (exercise: Exercise) => void
  showActions?: boolean
  isSelected?: boolean
  onSelect?: (exercise: Exercise) => void
}

export function ExerciseCard({
  exercise,
  onView,
  onEdit,
  onDelete,
  onAddToPrescription,
  showActions = true,
  isSelected = false,
  onSelect
}: ExerciseCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleVideoPlay = () => {
    setIsPlaying(true)
    // Implementar reprodução do vídeo
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
      case 2:
        return 'bg-green-100 text-green-800'
      case 3:
        return 'bg-yellow-100 text-yellow-800'
      case 4:
      case 5:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className={cn(
      "bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200",
      isSelected && "ring-2 ring-blue-500 border-blue-500",
      onSelect && "cursor-pointer"
    )}
    onClick={() => onSelect && onSelect(exercise)}
    >
      {/* Header com vídeo/imagem */}
      <div className="relative">
        {exercise.videoUrl ? (
          <div className="relative bg-gray-900 rounded-t-lg overflow-hidden h-48">
            {!isPlaying ? (
              <>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVideoPlay()
                    }}
                    className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                  >
                    <Play className="h-8 w-8 text-white ml-1" />
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                    Vídeo
                  </span>
                </div>
              </>
            ) : (
              <video
                controls
                autoPlay
                className="w-full h-full object-cover"
                src={exercise.videoUrl}
              />
            )}
          </div>
        ) : exercise.imageUrl ? (
          <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg flex items-center justify-center">
            <Target className="h-16 w-16 text-white opacity-60" />
          </div>
        )}

        {/* Badge de categoria */}
        <div className="absolute top-4 right-4">
          <span className="bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded text-xs font-medium">
            {EXERCISE_CATEGORY_LABELS[exercise.category]}
          </span>
        </div>

        {/* Badge de dificuldade */}
        <div className="absolute bottom-4 left-4">
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            getDifficultyColor(exercise.difficulty)
          )}>
            {EXERCISE_DIFFICULTY_LABELS[exercise.difficulty]}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Título e avaliação */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {exercise.name}
          </h3>
          
          {/* Rating (placeholder - implementar sistema de avaliação) */}
          <div className="flex items-center ml-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">4.5</span>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-gray-600 text-sm mb-3">
          {showFullDescription 
            ? exercise.description
            : truncateText(exercise.description, 100)
          }
          {exercise.description.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowFullDescription(!showFullDescription)
              }}
              className="text-blue-600 hover:text-blue-700 ml-1 font-medium"
            >
              {showFullDescription ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </p>

        {/* Parâmetros padrão */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            <span>{exercise.defaultSets} séries</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{exercise.defaultReps}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{exercise.defaultRest}s</span>
          </div>
        </div>

        {/* Equipamentos */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {exercise.equipment.slice(0, 3).map((equipment, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  {equipment}
                </span>
              ))}
              {exercise.equipment.length > 3 && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  +{exercise.equipment.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Indicações e contraindicações */}
        <div className="flex items-center justify-between mb-4 text-xs">
          {exercise.indications && exercise.indications.length > 0 && (
            <div className="flex items-center text-green-600">
              <Heart className="h-3 w-3 mr-1" />
              <span>{exercise.indications.length} indicação(ões)</span>
            </div>
          )}
          
          {exercise.contraindications && exercise.contraindications.length > 0 && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>{exercise.contraindications.length} contraindicação(ões)</span>
            </div>
          )}
        </div>

        {/* Ações */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(exercise)
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver detalhes
                </button>
              )}
            </div>
            
            <div className="flex space-x-1">
              {onAddToPrescription && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToPrescription(exercise)
                  }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="Adicionar à prescrição"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(exercise)
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(exercise)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
