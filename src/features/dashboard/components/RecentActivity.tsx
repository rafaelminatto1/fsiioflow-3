'use client'

import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'appointment' | 'patient' | 'session' | 'prescription'
  title: string
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'cancelled' | 'warning'
  user?: string
  patient?: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de atividades
    setTimeout(() => {
      setActivities([
        {
          id: '1',
          type: 'appointment',
          title: 'Consulta realizada',
          description: 'Sessão de fisioterapia - João Silva',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
          status: 'completed',
          user: 'Dr. Maria Santos',
          patient: 'João Silva'
        },
        {
          id: '2',
          type: 'patient',
          title: 'Novo paciente cadastrado',
          description: 'Ana Costa foi adicionada ao sistema',
          timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1h atrás
          status: 'completed',
          user: 'Recepção'
        },
        {
          id: '3',
          type: 'prescription',
          title: 'Prescrição criada',
          description: 'Exercícios para fortalecimento lombar',
          timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5h atrás
          status: 'completed',
          user: 'Dr. Pedro Lima',
          patient: 'Carlos Mendes'
        },
        {
          id: '4',
          type: 'appointment',
          title: 'Consulta cancelada',
          description: 'Cancelamento por motivo pessoal',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
          status: 'cancelled',
          patient: 'Lucia Santos'
        },
        {
          id: '5',
          type: 'session',
          title: 'Sessão em atraso',
          description: 'Paciente não compareceu no horário',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h atrás
          status: 'warning',
          patient: 'Roberto Silva'
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const getActivityIcon = (type: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (status === 'cancelled') {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (status === 'warning') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }

    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'patient':
        return <User className="h-4 w-4 text-green-500" />
      case 'session':
        return <Activity className="h-4 w-4 text-purple-500" />
      case 'prescription':
        return <FileText className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Agora'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`
    } else if (diffInMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h atrás`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days}d atrás`
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Atividade Recente
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Atividade Recente
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              "flex items-start space-x-3 pb-4",
              index !== activities.length - 1 && "border-b border-gray-100"
            )}
          >
            {/* Ícone */}
            <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
              {getActivityIcon(activity.type, activity.status)}
            </div>
            
            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {activity.description}
              </p>
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                {activity.user && (
                  <span>Por: {activity.user}</span>
                )}
                {activity.patient && (
                  <span>Paciente: {activity.patient}</span>
                )}
                <span>{formatTime(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Nenhuma atividade recente
          </h4>
          <p className="text-sm text-gray-500">
            As atividades aparecerão aqui quando ocorrerem.
          </p>
        </div>
      )}
    </div>
  )
}
