'use client'

import React from 'react'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { MetricCard } from './MetricCard'
import { QuickActions } from './QuickActions'
import { RecentActivity } from './RecentActivity'
import { cn } from '@/lib/utils'

export function DashboardOverview() {
  const { 
    metrics, 
    isLoading, 
    error,
    changePeriod,
    refreshData
  } = useDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-red-800 font-medium">Erro ao carregar dashboard</h3>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={refreshData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Visão geral do desempenho da clínica
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            onChange={(e) => changePeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Último ano</option>
          </select>
          
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Pacientes"
          value={metrics?.totalPatients || 0}
          change={metrics?.patientsChange || 0}
          icon={Users}
          color="blue"
        />
        
        <MetricCard
          title="Consultas do Mês"
          value={metrics?.monthlyAppointments || 0}
          change={metrics?.appointmentsChange || 0}
          icon={Calendar}
          color="green"
        />
        
        <MetricCard
          title="Receita Mensal"
          value={metrics?.monthlyRevenue || 0}
          change={metrics?.revenueChange || 0}
          icon={DollarSign}
          color="purple"
          format="currency"
        />
        
        <MetricCard
          title="Taxa de Ocupação"
          value={metrics?.occupancyRate || 0}
          change={metrics?.occupancyChange || 0}
          icon={TrendingUp}
          color="orange"
          format="percentage"
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Consultas Hoje</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Agendadas</span>
              <span className="font-medium">{metrics?.todayAppointments?.scheduled || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Realizadas</span>
              <span className="font-medium text-green-600">{metrics?.todayAppointments?.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Canceladas</span>
              <span className="font-medium text-red-600">{metrics?.todayAppointments?.cancelled || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tempo Médio</h3>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Consulta</span>
              <span className="font-medium">{metrics?.averageSessionTime || 0}min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Espera</span>
              <span className="font-medium">{metrics?.averageWaitTime || 0}min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Intervalo</span>
              <span className="font-medium">{metrics?.averageBreakTime || 0}min</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Satisfação</h3>
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Média Geral</span>
              <span className="font-medium">{metrics?.averageRating || 0}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recomendações</span>
              <span className="font-medium text-green-600">{metrics?.recommendationRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Reclamações</span>
              <span className="font-medium text-red-600">{metrics?.complaintsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas e Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>

      {/* Alertas e Notificações */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            Alertas e Notificações
          </h3>
          
          <div className="space-y-3">
            {metrics.alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg",
                  alert.type === 'warning' && "bg-yellow-50 border border-yellow-200",
                  alert.type === 'error' && "bg-red-50 border border-red-200",
                  alert.type === 'info' && "bg-blue-50 border border-blue-200"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-2 h-2 rounded-full mt-2",
                  alert.type === 'warning' && "bg-yellow-500",
                  alert.type === 'error' && "bg-red-500",
                  alert.type === 'info' && "bg-blue-500"
                )}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  {alert.action && (
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1">
                      {alert.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
