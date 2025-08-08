'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { User } from '@/types/prisma'
import { USER_ROLES } from '@/constants'
import { hasPermission, isAdmin, isPhysiotherapist, isPatient } from '@/lib/auth'

interface AuthContextType {
  // Estado da autenticação
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Métodos de autenticação
  login: (credentials: LoginCredentials) => Promise<AuthResult>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<AuthResult>
  
  // Verificações de permissão
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
  isPhysiotherapist: () => boolean
  isPatient: () => boolean
  
  // Utilitários
  refreshSession: () => Promise<void>
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

interface AuthResult {
  success: boolean
  error?: string
  user?: User
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Atualizar estado do usuário quando a sessão mudar
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (session?.user) {
      setUser(session.user as User)
      setIsLoading(false)
    } else {
      setUser(null)
      setIsLoading(false)
    }
  }, [session, status])

  // Login com credenciais
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true)

      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      })

      if (result?.error) {
        setIsLoading(false)
        return {
          success: false,
          error: result.error === 'CredentialsSignin' 
            ? 'Email ou senha incorretos' 
            : result.error
        }
      }

      // Aguardar a sessão ser atualizada
      const newSession = await getSession()
      if (newSession?.user) {
        setUser(newSession.user as User)
        setIsLoading(false)
        return {
          success: true,
          user: newSession.user as User
        }
      }

      setIsLoading(false)
      return {
        success: false,
        error: 'Erro ao obter dados do usuário'
      }
    } catch (error) {
      setIsLoading(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      await signOut({ redirect: false })
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Registro
  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setIsLoading(false)
        return {
          success: false,
          error: result.message || 'Erro ao criar conta'
        }
      }

      // Fazer login automaticamente após registro
      const loginResult = await login({
        email: data.email,
        password: data.password
      })

      return loginResult
    } catch (error) {
      setIsLoading(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Verificar permissão
  const checkPermission = (permission: string): boolean => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  // Verificar se é admin
  const checkIsAdmin = (): boolean => {
    if (!user) return false
    return isAdmin(user.role)
  }

  // Verificar se é fisioterapeuta
  const checkIsPhysiotherapist = (): boolean => {
    if (!user) return false
    return isPhysiotherapist(user.role)
  }

  // Verificar se é paciente
  const checkIsPatient = (): boolean => {
    if (!user) return false
    return isPatient(user.role)
  }

  // Atualizar sessão
  const refreshSession = async (): Promise<void> => {
    try {
      await update()
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    hasPermission: checkPermission,
    isAdmin: checkIsAdmin,
    isPhysiotherapist: checkIsPhysiotherapist,
    isPatient: checkIsPatient,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto de autenticação
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

// HOC para proteger componentes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasPermission } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h1>
            <p className="text-gray-600">
              Você precisa estar logado para acessar esta página.
            </p>
          </div>
        </div>
      )
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        hasPermission(permission)
      )

      if (!hasRequiredPermissions) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Acesso Negado
              </h1>
              <p className="text-gray-600">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </div>
        )
      }
    }

    return <Component {...props} />
  }
}
