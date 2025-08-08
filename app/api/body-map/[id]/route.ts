import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAndSanitize, updateBodyMapSchema } from '@/lib/validations'
import { coordinatesToPoint } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão
    const userRole = session.user.role
    if (!['ADMIN', 'FISIOTERAPEUTA', 'ESTAGIARIO'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    // Verificar se o ponto existe
    const existingPoint = await prisma.bodyMap.findUnique({
      where: { id, isActive: true }
    })

    if (!existingPoint) {
      return NextResponse.json({ error: 'Ponto de dor não encontrado' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = { ...body }
    if (body.x !== undefined && body.y !== undefined) {
      updateData.coordinates = coordinatesToPoint(body.x, body.y)
    }

    // Validar dados
    const validatedData = validateAndSanitize(updateBodyMapSchema, updateData)

    // Atualizar ponto de dor
    const updatedPoint = await prisma.bodyMap.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(updatedPoint)
  } catch (error: any) {
    console.error('Erro ao atualizar ponto de dor:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verificar se o ponto existe
    const existingPoint = await prisma.bodyMap.findUnique({
      where: { id, isActive: true }
    })

    if (!existingPoint) {
      return NextResponse.json({ error: 'Ponto de dor não encontrado' }, { status: 404 })
    }

    // Soft delete
    await prisma.bodyMap.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Ponto de dor excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir ponto de dor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
