'use client'

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { ExerciseLibrary } from '@/features/exercises/components/ExerciseLibrary'

function ExercisesPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExerciseLibrary showActions={true} />
      </div>
    </div>
  )
}

export default function ExercisesPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_exercises']}>
      <ExercisesPageContent />
    </ProtectedRoute>
  )
}
