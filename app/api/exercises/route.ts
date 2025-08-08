import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAndSanitize, createExerciseSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros
    const where: any = {
      isActive: true,
      deletedAt: null
    }

    if (category) {
      where.category = category
    }

    if (difficulty) {
      where.difficulty = parseInt(difficulty)
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { equipment: { hasSome: [search] } }
      ]
    }

    // Buscar exercícios
    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset
      }),
      prisma.exercise.count({ where })
    ])

    return NextResponse.json({
      exercises,
      total,
      currentPage: Math.floor(offset / limit) + 1,
      pageSize: limit
    })
  } catch (error) {
    console.error('Erro ao buscar exercícios:', error)
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

    // Verificar permissão
    const userRole = session.user.role
    if (!['ADMIN', 'FISIOTERAPEUTA'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    // Validar dados
    const validatedData = validateAndSanitize(createExerciseSchema, body)

    // Criar exercício
    const exercise = await prisma.exercise.create({
      data: {
        ...validatedData,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar exercício:', error)

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
