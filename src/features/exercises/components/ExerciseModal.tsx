'use client'

import React from 'react'
import { X, Play, Edit, Plus, Star, Clock, Target, Users, AlertTriangle, Heart } from 'lucide-react'
import { Exercise } from '@/types/prisma'
import { EXERCISE_CATEGORY_LABELS, EXERCISE_DIFFICULTY_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

interface ExerciseModalProps {
  exercise: Exercise
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onAddToPrescription?: (exercise: Exercise) => void
}

export function ExerciseModal({ exercise, isOpen, onClose, onEdit, onAddToPrescription }: ExerciseModalProps) {
  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{exercise.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-600">
                {EXERCISE_CATEGORY_LABELS[exercise.category]}
              </span>
              <span className="text-gray-400">•</span>
              <span className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                getDifficultyColor(exercise.difficulty)
              )}>
                {EXERCISE_DIFFICULTY_LABELS[exercise.difficulty]}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
            
            {onAddToPrescription && (
              <button
                onClick={() => onAddToPrescription(exercise)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar à Prescrição
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Vídeo/Imagem */}
          {exercise.videoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full object-cover"
                src={exercise.videoUrl}
                poster={exercise.imageUrl}
              />
            </div>
          )}

          {/* Descrição */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
            <p className="text-gray-700 leading-relaxed">{exercise.description}</p>
          </div>

          {/* Instruções */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instruções</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{exercise.instructions}</p>
            </div>
          </div>

          {/* Parâmetros */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parâmetros Padrão</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{exercise.defaultSets}</div>
                <div className="text-sm text-gray-600">Séries</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{exercise.defaultReps}</div>
                <div className="text-sm text-gray-600">Repetições</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{exercise.defaultRest}s</div>
                <div className="text-sm text-gray-600">Descanso</div>
              </div>
            </div>
          </div>

          {/* Equipamentos */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Equipamentos Necessários</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map((equipment, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Indicações */}
          {exercise.indications && exercise.indications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Heart className="h-5 w-5 text-green-600 mr-2" />
                Indicações
              </h3>
              <ul className="space-y-1">
                {exercise.indications.map((indication, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{indication}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contraindicações */}
          {exercise.contraindications && exercise.contraindications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Contraindicações
              </h3>
              <ul className="space-y-1">
                {exercise.contraindications.map((contraindication, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{contraindication}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
