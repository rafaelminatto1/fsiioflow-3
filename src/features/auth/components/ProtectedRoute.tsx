'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { USER_ROLES } from '@/constants'
import { hasPermission } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: keyof typeof USER_ROLES
  requiredPermissions?: string[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Redirect to login
    router.push(redirectTo)
    return null
  }

  const user = session.user
  const userRole = user.role

  // Check required role
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta área.
          </p>
          <p className="text-sm text-gray-500">
            Role necessário: <span className="font-medium">{requiredRole}</span>
          </p>
          <p className="text-sm text-gray-500">
            Seu role: <span className="font-medium">{userRole}</span>
          </p>
        </div>
      </div>
    )
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      hasPermission(userRole, permission)
    )

    if (!hasRequiredPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Permissões Insuficientes
            </h1>
            <p className="text-gray-600 mb-4">
              Você não possui as permissões necessárias para acessar esta funcionalidade.
            </p>
            <div className="text-sm text-gray-500">
              <p className="mb-1">Permissões necessárias:</p>
              <ul className="list-disc list-inside space-y-1">
                {requiredPermissions.map(permission => (
                  <li key={permission} className="font-medium">
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

// Hook para verificar permissões em componentes
export function usePermissions() {
  const { data: session } = useSession()

  const checkPermission = (permission: string): boolean => {
    if (!session?.user) return false
    return hasPermission(session.user.role, permission)
  }

  const checkRole = (role: keyof typeof USER_ROLES): boolean => {
    if (!session?.user) return false
    return session.user.role === role
  }

  const isAdmin = (): boolean => checkRole('ADMIN')
  const isPhysiotherapist = (): boolean => checkRole('FISIOTERAPEUTA')
  const isIntern = (): boolean => checkRole('ESTAGIARIO')
  const isPatient = (): boolean => checkRole('PACIENTE')
  const isPartner = (): boolean => checkRole('PARCEIRO')

  return {
    user: session?.user,
    checkPermission,
    checkRole,
    isAdmin,
    isPhysiotherapist,
    isIntern,
    isPatient,
    isPartner,
    isAuthenticated: !!session?.user
  }
}

// Componente para renderizar condicionalmente baseado em permissões
interface ConditionalRenderProps {
  children: React.ReactNode
  requiredRole?: keyof typeof USER_ROLES
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}

export function ConditionalRender({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback = null
}: ConditionalRenderProps) {
  const { user, checkPermission, checkRole } = usePermissions()

  if (!user) {
    return <>{fallback}</>
  }

  // Check role
  if (requiredRole && !checkRole(requiredRole)) {
    return <>{fallback}</>
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(checkPermission)
    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
