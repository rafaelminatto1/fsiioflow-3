import { useState, useEffect, useCallback } from 'react'
import { User } from '@/types/prisma'
import { USER_ROLES } from '@/constants'

// Tipos para autenticação
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  role?: keyof typeof USER_ROLES
}

// Hook principal de autenticação
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Verificar se usuário está autenticado
  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const user = await response.json()
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }, [])

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao fazer login')
      }

      const { user } = await response.json()
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })

      return { success: true, user }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }, [])

  // Registro
  const register = useCallback(async (data: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar conta')
      }

      const { user } = await response.json()
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      })

      return { success: true, user }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  // Verificar permissão
  const hasPermission = useCallback((permission: string) => {
    if (!authState.user) return false
    
    const rolePermissions = {
      [USER_ROLES.ADMIN]: [
        'manage_users',
        'manage_patients',
        'manage_appointments',
        'manage_exercises',
        'view_reports',
        'manage_clinic_settings'
      ],
      [USER_ROLES.FISIOTERAPEUTA]: [
        'manage_patients',
        'manage_appointments',
        'manage_exercises',
        'create_prescriptions',
        'view_patient_reports'
      ],
      [USER_ROLES.ESTAGIARIO]: [
        'view_patients',
        'create_appointments',
        'view_exercises'
      ],
      [USER_ROLES.PACIENTE]: [
        'view_own_data',
        'view_own_appointments',
        'view_own_exercises'
      ],
      [USER_ROLES.PARCEIRO]: [
        'view_shared_patients',
        'create_exercise_recommendations'
      ]
    }

    const permissions = rolePermissions[authState.user.role as keyof typeof USER_ROLES] || []
    return permissions.includes(permission)
  }, [authState.user])

  // Verificar se é admin
  const isAdmin = useCallback(() => {
    return authState.user?.role === USER_ROLES.ADMIN
  }, [authState.user])

  // Verificar se é fisioterapeuta
  const isPhysiotherapist = useCallback(() => {
    return authState.user?.role === USER_ROLES.FISIOTERAPEUTA
  }, [authState.user])

  // Verificar se é paciente
  const isPatient = useCallback(() => {
    return authState.user?.role === USER_ROLES.PACIENTE
  }, [authState.user])

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    ...authState,
    login,
    logout,
    register,
    checkAuth,
    hasPermission,
    isAdmin,
    isPhysiotherapist,
    isPatient
  }
}

