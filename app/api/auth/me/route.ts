import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar dados completos do usuário
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        crefito: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        patientProfile: {
          select: {
            id: true,
            cpf: true,
            birthDate: true,
            phone: true,
            address: true,
            healthInsurance: true
          }
        },
        partnerProfile: {
          select: {
            id: true,
            cref: true,
            specialty: true,
            bio: true,
            experience: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
