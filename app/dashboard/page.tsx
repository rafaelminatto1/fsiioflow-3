'use client'

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { DashboardOverview } from '@/features/dashboard/components/DashboardOverview'

function DashboardPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardOverview />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermissions={['view_dashboard']}>
      <DashboardPageContent />
    </ProtectedRoute>
  )
}