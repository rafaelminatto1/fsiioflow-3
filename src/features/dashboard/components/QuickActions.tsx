'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  Activity, 
  Clock,
  UserPlus,
  CalendarPlus
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'

export function QuickActions() {
  const router = useRouter()
  const { hasPermission } = useAuth()

  const actions = [
    {
      title: 'Nova Consulta',
      description: 'Agendar nova consulta',
      icon: CalendarPlus,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => router.push('/appointments/new'),
      permission: 'manage_appointments'
    },
    {
      title: 'Novo Paciente',
      description: 'Cadastrar novo paciente',
      icon: UserPlus,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => router.push('/patients/new'),
      permission: 'manage_patients'
    },
    {
      title: 'Relatórios',
      description: 'Gerar relatórios',
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => router.push('/reports'),
      permission: 'view_reports'
    },
    {
      title: 'Agenda',
      description: 'Ver agenda do dia',
      icon: Calendar,
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => router.push('/appointments'),
      permission: 'view_appointments'
    }
  ]

  const visibleActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  )

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Ações Rápidas
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {visibleActions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white rounded-lg p-4 text-left transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{action.description}</p>
                </div>
                <Icon className="h-6 w-6" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Estatísticas rápidas */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Estatísticas Rápidas
        </h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Consultas hoje</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Pacientes ativos</span>
            <span className="font-medium">248</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Taxa ocupação</span>
            <span className="font-medium text-green-600">85%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
