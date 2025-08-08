'use client'

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  format?: 'number' | 'currency' | 'percentage'
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  change = 0,
  icon: Icon,
  color,
  format = 'number',
  subtitle
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return `${val}%`
      default:
        return formatNumber(val)
    }
  }

  const getColorClasses = (colorName: string) => {
    const colors = {
      blue: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
      },
      green: {
        icon: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200'
      },
      purple: {
        icon: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200'
      },
      orange: {
        icon: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200'
      },
      red: {
        icon: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200'
      }
    }
    return colors[colorName as keyof typeof colors] || colors.blue
  }

  const colorClasses = getColorClasses(color)
  const isPositiveChange = change > 0
  const isNegativeChange = change < 0

  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
            colorClasses.bg,
            colorClasses.border,
            "border"
          )}>
            <Icon className={cn("h-6 w-6", colorClasses.icon)} />
          </div>
        </div>

        {/* Indicador de mudança */}
        {change !== 0 && (
          <div className="mt-4 flex items-center">
            <div className={cn(
              "flex items-center text-sm font-medium",
              isPositiveChange && "text-green-600",
              isNegativeChange && "text-red-600"
            )}>
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
            <span className="text-sm text-gray-500 ml-2">
              vs período anterior
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
