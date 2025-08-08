import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userRole = session.user.role
    if (!['ADMIN', 'FISIOTERAPEUTA', 'ESTAGIARIO'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Calcular datas baseado no período
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        previousStartDate = new Date(now.getFullYear(), quarterStart - 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    const previousEndDate = new Date(startDate.getTime() - 1)

    // Buscar métricas em paralelo
    const [
      totalPatients,
      previousTotalPatients,
      monthlyAppointments,
      previousMonthlyAppointments,
      todayAppointments,
      monthlyRevenue,
      previousMonthlyRevenue
    ] = await Promise.all([
      // Total de pacientes ativos
      prisma.patient.count({
        where: {
          isActive: true,
          deletedAt: null,
          createdAt: { lte: now }
        }
      }),

      // Total de pacientes no período anterior
      prisma.patient.count({
        where: {
          isActive: true,
          deletedAt: null,
          createdAt: { lte: previousEndDate }
        }
      }),

      // Consultas do período atual
      prisma.appointment.count({
        where: {
          dateTime: {
            gte: startDate,
            lte: now
          },
          isActive: true
        }
      }),

      // Consultas do período anterior
      prisma.appointment.count({
        where: {
          dateTime: {
            gte: previousStartDate,
            lte: previousEndDate
          },
          isActive: true
        }
      }),

      // Consultas de hoje
      prisma.appointment.findMany({
        where: {
          dateTime: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          },
          isActive: true
        },
        select: {
          status: true
        }
      }),

      // Receita do período atual
      prisma.appointment.aggregate({
        where: {
          dateTime: {
            gte: startDate,
            lte: now
          },
          isPaid: true,
          isActive: true
        },
        _sum: {
          value: true
        }
      }),

      // Receita do período anterior
      prisma.appointment.aggregate({
        where: {
          dateTime: {
            gte: previousStartDate,
            lte: previousEndDate
          },
          isPaid: true,
          isActive: true
        },
        _sum: {
          value: true
        }
      })
    ])

    // Calcular mudanças percentuais
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // Processar consultas de hoje
    const todayStats = todayAppointments.reduce(
      (acc, appointment) => {
        acc.scheduled++
        if (appointment.status === 'COMPLETED') acc.completed++
        if (appointment.status === 'CANCELLED') acc.cancelled++
        return acc
      },
      { scheduled: 0, completed: 0, cancelled: 0 }
    )

    // Calcular taxa de ocupação (simulada)
    const occupancyRate = Math.min(
      Math.round((monthlyAppointments / (30 * 8)) * 100), // 8 slots por dia
      100
    )

    const previousOccupancyRate = Math.min(
      Math.round((previousMonthlyAppointments / (30 * 8)) * 100),
      100
    )

    // Simular alguns alertas
    const alerts = []
    
    if (occupancyRate < 50) {
      alerts.push({
        type: 'warning',
        title: 'Taxa de ocupação baixa',
        message: `A taxa de ocupação está em ${occupancyRate}%, abaixo do ideal.`,
        action: 'Ver estratégias'
      })
    }

    if (todayStats.cancelled > 3) {
      alerts.push({
        type: 'error',
        title: 'Muitos cancelamentos hoje',
        message: `${todayStats.cancelled} consultas foram canceladas hoje.`,
        action: 'Verificar motivos'
      })
    }

    const metrics = {
      totalPatients,
      patientsChange: calculateChange(totalPatients, previousTotalPatients),
      
      monthlyAppointments,
      appointmentsChange: calculateChange(monthlyAppointments, previousMonthlyAppointments),
      
      monthlyRevenue: Number(monthlyRevenue._sum.value || 0),
      revenueChange: calculateChange(
        Number(monthlyRevenue._sum.value || 0),
        Number(previousMonthlyRevenue._sum.value || 0)
      ),
      
      occupancyRate,
      occupancyChange: calculateChange(occupancyRate, previousOccupancyRate),
      
      todayAppointments: todayStats,
      
      // Métricas simuladas (implementar com dados reais)
      averageSessionTime: 45,
      averageWaitTime: 8,
      averageBreakTime: 15,
      averageRating: 4.7,
      recommendationRate: 92,
      complaintsCount: 2,
      
      alerts
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
