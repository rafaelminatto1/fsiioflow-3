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

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!patientId) {
      return NextResponse.json({ error: 'ID do paciente é obrigatório' }, { status: 400 })
    }

    // Verificar permissão
    const userRole = session.user.role
    if (userRole === 'PACIENTE' && session.user.id !== patientId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Calcular data inicial
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Buscar pontos de dor agrupados por dia
    const painPointsRaw = await prisma.$queryRaw`
      SELECT 
        DATE(recorded_at) as date,
        AVG(intensity::numeric) as average_intensity,
        COUNT(*) as point_count
      FROM body_maps 
      WHERE patient_id = ${patientId}
        AND is_active = true 
        AND deleted_at IS NULL
        AND recorded_at >= ${startDate}
      GROUP BY DATE(recorded_at)
      ORDER BY DATE(recorded_at) DESC
    ` as any[]

    // Transformar dados
    const evolution = painPointsRaw.map(row => ({
      date: new Date(row.date),
      averageIntensity: parseFloat(row.average_intensity),
      pointCount: parseInt(row.point_count)
    }))

    return NextResponse.json(evolution)
  } catch (error) {
    console.error('Erro ao buscar evolução da dor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
