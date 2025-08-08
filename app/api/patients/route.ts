import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAndSanitize, createPatientSchema, patientFiltersSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const filtersData = Object.fromEntries(searchParams.entries())
    
    // Validar filtros
    const filters = validateAndSanitize(patientFiltersSchema, filtersData)

    // Construir query
    const where: any = {
      isActive: filters.isActive ?? true,
      deletedAt: null
    }

    // Filtro de busca
    if (filters.search) {
      where.OR = [
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { cpf: { contains: filters.search.replace(/\D/g, '') } }
      ]
    }

    // Filtro por fisioterapeuta
    if (filters.physiotherapistId) {
      where.appointments = {
        some: {
          physiotherapistId: filters.physiotherapistId
        }
      }
    }

    // Filtro por data
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    // Buscar pacientes
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              createdAt: true
            }
          },
          appointments: {
            take: 1,
            orderBy: { dateTime: 'desc' },
            include: {
              physiotherapist: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset
      }),
      prisma.patient.count({ where })
    ])

    return NextResponse.json({
      patients,
      total,
      currentPage: Math.floor(filters.offset / filters.limit) + 1,
      pageSize: filters.limit,
      totalPages: Math.ceil(total / filters.limit)
    })
  } catch (error: any) {
    console.error('Erro ao buscar pacientes:', error)
    
    if (error.errors) {
      return NextResponse.json({
        error: 'Filtros inválidos',
        details: error.errors
      }, { status: 400 })
    }

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
    const validatedData = validateAndSanitize(createPatientSchema, body)

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.user.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se CPF já existe
    const existingPatient = await prisma.patient.findUnique({
      where: { cpf: validatedData.cpf.replace(/\D/g, '') }
    })

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.user.password)

    // Criar usuário e paciente em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          email: validatedData.user.email,
          password: hashedPassword,
          name: validatedData.user.name,
          role: 'PACIENTE',
          phone: validatedData.user.phone
        }
      })

      // Criar paciente
      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          cpf: validatedData.cpf.replace(/\D/g, ''),
          rg: validatedData.rg,
          birthDate: validatedData.birthDate,
          phone: validatedData.phone,
          email: validatedData.email,
          emergencyContact: validatedData.emergencyContact,
          address: validatedData.address,
          healthInsurance: validatedData.healthInsurance,
          medicalHistory: {},
          currentMedications: validatedData.currentMedications,
          allergies: validatedData.allergies,
          profession: validatedData.profession,
          workplace: validatedData.workplace
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              createdAt: true
            }
          }
        }
      })

      return patient
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar paciente:', error)

    if (error.errors) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }

    // Erro do Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      const message = field === 'email' 
        ? 'Este email já está em uso'
        : field === 'cpf'
        ? 'Este CPF já está cadastrado'
        : 'Dados já existem no sistema'

      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}