'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { validateAndSanitize, createUserSchema } from '@/lib/validations'
import { USER_ROLES, ROLE_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: keyof typeof USER_ROLES
  crefito?: string
  phone?: string
}

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PACIENTE',
    crefito: '',
    phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpar erro do campo específico
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Limpar erro geral
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setValidationErrors({})

    try {
      // Validar confirmação de senha
      if (formData.password !== formData.confirmPassword) {
        setValidationErrors({ confirmPassword: 'As senhas não coincidem' })
        return
      }

      // Preparar dados para validação
      const dataToValidate = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.crefito && { crefito: formData.crefito }),
        ...(formData.phone && { phone: formData.phone })
      }

      // Validar dados
      const validatedData = validateAndSanitize(createUserSchema, dataToValidate)

      // Criar conta
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          // Erros de validação do servidor
          const errors: Record<string, string> = {}
          result.errors.forEach((error: any) => {
            errors[error.path] = error.message
          })
          setValidationErrors(errors)
        } else {
          setError(result.message || 'Erro ao criar conta')
        }
        return
      }

      // Sucesso
      setSuccess(true)
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login?message=Conta criada com sucesso')
      }, 2000)

    } catch (validationError: any) {
      if (validationError.errors) {
        const errors: Record<string, string> = {}
        validationError.errors.forEach((error: any) => {
          errors[error.path[0]] = error.message
        })
        setValidationErrors(errors)
      } else {
        setError('Dados inválidos')
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Conta criada com sucesso!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Criar nova conta
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Ou{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            entre na sua conta existente
          </button>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro no cadastro
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome completo
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className={cn(
                "block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                validationErrors.name
                  ? "border-red-300 text-red-900 placeholder-red-300"
                  : "border-gray-300"
              )}
              placeholder="Seu nome completo"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={cn(
                "block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                validationErrors.email
                  ? "border-red-300 text-red-900 placeholder-red-300"
                  : "border-gray-300"
              )}
              placeholder="seu@email.com"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Tipo de usuário
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>
          {validationErrors.role && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.role}</p>
          )}
        </div>

        {(formData.role === 'FISIOTERAPEUTA' || formData.role === 'PARCEIRO') && (
          <div>
            <label htmlFor="crefito" className="block text-sm font-medium text-gray-700">
              {formData.role === 'FISIOTERAPEUTA' ? 'CREFITO' : 'CREF'}
            </label>
            <input
              id="crefito"
              name="crefito"
              type="text"
              value={formData.crefito}
              onChange={handleInputChange}
              className={cn(
                "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                validationErrors.crefito
                  ? "border-red-300 text-red-900 placeholder-red-300"
                  : "border-gray-300"
              )}
              placeholder={`Número do ${formData.role === 'FISIOTERAPEUTA' ? 'CREFITO' : 'CREF'}`}
            />
            {validationErrors.crefito && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.crefito}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefone (opcional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            className={cn(
              "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              validationErrors.phone
                ? "border-red-300 text-red-900 placeholder-red-300"
                : "border-gray-300"
            )}
            placeholder="(11) 99999-9999"
          />
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={cn(
                "block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                validationErrors.password
                  ? "border-red-300 text-red-900 placeholder-red-300"
                  : "border-gray-300"
              )}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar senha
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={cn(
                "block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                validationErrors.confirmPassword
                  ? "border-red-300 text-red-900 placeholder-red-300"
                  : "border-gray-300"
              )}
              placeholder="Digite a senha novamente"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
