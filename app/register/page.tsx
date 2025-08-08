'use client'

import { RegisterForm } from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            FisioFlow
          </h1>
          <p className="text-gray-600">
            Sistema de Gestão para Clínicas de Fisioterapia
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center text-xs text-gray-500">
          <p>
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
