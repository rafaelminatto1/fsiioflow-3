import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { validateAndSanitize, createUserSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados de entrada
    const validatedData = validateAndSanitize(createUserSchema, body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // Verificar CREFITO/CREF se fornecido
    if (validatedData.crefito) {
      const existingCrefito = await prisma.user.findUnique({
        where: { crefito: validatedData.crefito }
      })

      if (existingCrefito) {
        return NextResponse.json(
          { message: 'Este CREFITO/CREF já está em uso' },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        crefito: validatedData.crefito,
        phone: validatedData.phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        crefito: true,
        phone: true,
        createdAt: true
      }
    })

    // Se for um paciente, criar perfil de paciente
    if (validatedData.role === 'PACIENTE') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          cpf: '', // Será preenchido posteriormente
          birthDate: new Date(), // Será preenchido posteriormente
          phone: validatedData.phone || '',
          email: validatedData.email,
          address: {},
          medicalHistory: {}
        }
      })
    }

    // Se for um parceiro, criar perfil de parceiro
    if (validatedData.role === 'PARCEIRO') {
      await prisma.partner.create({
        data: {
          userId: user.id,
          cref: validatedData.crefito || '',
          specialty: []
        }
      })
    }

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)

    // Erro de validação
    if (error.errors) {
      return NextResponse.json(
        {
          message: 'Dados inválidos',
          errors: error.errors.map((err: any) => ({
            path: err.path[0],
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Erro do Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      const message = field === 'email' 
        ? 'Este email já está em uso'
        : field === 'crefito'
        ? 'Este CREFITO/CREF já está em uso'
        : 'Dados já existem no sistema'

      return NextResponse.json(
        { message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
