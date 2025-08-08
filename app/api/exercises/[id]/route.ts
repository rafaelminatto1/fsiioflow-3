import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userRole = session.user.role
    if (!['ADMIN', 'FISIOTERAPEUTA'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const exercise = await prisma.exercise.update({
      where: { id, isActive: true },
      data: body
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Erro ao atualizar exercício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userRole = session.user.role
    if (!['ADMIN', 'FISIOTERAPEUTA'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params

    await prisma.exercise.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Exercício excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir exercício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
