// app/api/dashboard/stats/route.ts - Dashboard statistics API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const today = new Date();
    
    // Buscar estatísticas em paralelo
    const [
      totalPatients,
      todayAppointments, 
      pendingTasks,
      monthlyRevenue
    ] = await Promise.all([
      // Total de pacientes ativos
      prisma.patient.count({
        where: { isActive: true }
      }),
      
      // Consultas de hoje
      prisma.appointment.count({
        where: {
          dateTime: {
            gte: startOfDay(today),
            lte: endOfDay(today)
          },
          status: { not: 'CANCELADO' }
        }
      }),
      
      // Tarefas pendentes (simulado - pode ser implementado depois)
      Promise.resolve(3),
      
      // Receita mensal
      prisma.appointment.aggregate({
        where: {
          dateTime: {
            gte: startOfMonth(today),
            lte: endOfMonth(today)
          },
          isPaid: true
        },
        _sum: { value: true }
      }).then(result => result._sum.value || 0)
    ]);

    return NextResponse.json({
      totalPatients,
      todayAppointments,
      pendingTasks,
      monthlyRevenue: Number(monthlyRevenue)
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}