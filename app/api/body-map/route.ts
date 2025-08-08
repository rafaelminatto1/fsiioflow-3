import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAndSanitize, createBodyMapSchema } from '@/lib/validations'
import { coordinatesToPoint } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minIntensity = searchParams.get('minIntensity')
    const maxIntensity = searchParams.get('maxIntensity')
    const bodyPart = searchParams.get('bodyPart')
    const side = searchParams.get('side')

    if (!patientId) {
      return NextResponse.json({ error: 'ID do paciente é obrigatório' }, { status: 400 })
    }

    // Verificar permissão para acessar dados do paciente
    const userRole = session.user.role
    if (userRole === 'PACIENTE' && session.user.id !== patientId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Construir filtros
    const where: any = {
      patientId,
      isActive: true,
      deletedAt: null
    }

    if (startDate && endDate) {
      where.recordedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (minIntensity !== null && maxIntensity !== null) {
      where.intensity = {
        gte: parseInt(minIntensity || '0'),
        lte: parseInt(maxIntensity || '10')
      }
    }

    if (bodyPart) {
      where.bodyPart = {
        contains: bodyPart,
        mode: 'insensitive'
      }
    }

    if (side) {
      where.side = side
    }

    // Buscar pontos de dor
    const painPoints = await prisma.bodyMap.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 100 // Limitar para evitar sobrecarga
    })

    return NextResponse.json(painPoints)
  } catch (error) {
    console.error('Erro ao buscar pontos de dor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão para criar pontos de dor
    const userRole = session.user.role
    if (!['ADMIN', 'FISIOTERAPEUTA', 'ESTAGIARIO'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    // Validar dados
    const validatedData = validateAndSanitize(createBodyMapSchema, {
      ...body,
      coordinates: coordinatesToPoint(body.x, body.y)
    })

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId, isActive: true }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    // Criar ponto de dor
    const painPoint = await prisma.bodyMap.create({
      data: validatedData
    })

    return NextResponse.json(painPoint, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar ponto de dor:', error)

    if (error.errors) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}