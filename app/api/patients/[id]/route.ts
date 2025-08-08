import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAndSanitize, updatePatientSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params
    const userRole = session.user.role

    // Verificar permissão
    if (userRole === 'PACIENTE' && session.user.id !== id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (!['ADMIN', 'FISIOTERAPEUTA', 'ESTAGIARIO', 'PACIENTE'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar paciente com dados completos
    const patient = await prisma.patient.findUnique({
      where: { 
        id,
        isActive: true,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
            updatedAt: true
          }
        },
        appointments: {
          include: {
            physiotherapist: {
              select: {
                id: true,
                name: true,
                crefito: true
              }
            },
            session: true
          },
          orderBy: { dateTime: 'desc' },
          take: 10
        },
        clinicalRecords: {
          include: {
            physiotherapist: {
              select: {
                id: true,
                name: true,
                crefito: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        bodyMaps: {
          where: {
            isActive: true,
            deletedAt: null
          },
          orderBy: { recordedAt: 'desc' },
          take: 50
        },
        prescriptions: {
          where: {
            isActive: true,
            deletedAt: null
          },
          include: {
            physiotherapist: {
              select: {
                id: true,
                name: true
              }
            },
            exercises: {
              include: {
                exercise: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Erro ao buscar paciente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params
    const userRole = session.user.role

    // Verificar permissão
    if (!['ADMIN', 'FISIOTERAPEUTA'].includes(userRole)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id, isActive: true },
      include: { user: true }
    })

    if (!existingPatient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    const body = await request.json()

    // Validar dados
    const validatedData = validateAndSanitize(updatePatientSchema, body)

    // Verificar conflitos de email (se mudou)
    if (validatedData.email && validatedData.email !== existingPatient.email) {
      const emailExists = await prisma.patient.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Verificar conflitos de CPF (se mudou)
    if (validatedData.cpf && validatedData.cpf.replace(/\D/g, '') !== existingPatient.cpf) {
      const cpfExists = await prisma.patient.findFirst({
        where: {
          cpf: validatedData.cpf.replace(/\D/g, ''),
          id: { not: id }
        }
      })

      if (cpfExists) {
        return NextResponse.json(
          { error: 'Este CPF já está cadastrado' },
          { status: 400 }
        )
      }
    }

    // Atualizar paciente e usuário em transação
    const updatedPatient = await prisma.$transaction(async (tx) => {
      // Atualizar dados do usuário se fornecidos
      if (validatedData.name || validatedData.email || validatedData.phone) {
        await tx.user.update({
          where: { id: existingPatient.userId },
          data: {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.email && { email: validatedData.email }),
            ...(validatedData.phone && { phone: validatedData.phone })
          }
        })
      }

      // Atualizar dados do paciente
      const updateData: any = {}
      
      if (validatedData.cpf) updateData.cpf = validatedData.cpf.replace(/\D/g, '')
      if (validatedData.rg !== undefined) updateData.rg = validatedData.rg
      if (validatedData.birthDate) updateData.birthDate = validatedData.birthDate
      if (validatedData.phone) updateData.phone = validatedData.phone
      if (validatedData.email) updateData.email = validatedData.email
      if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact
      if (validatedData.address) updateData.address = validatedData.address
      if (validatedData.healthInsurance !== undefined) updateData.healthInsurance = validatedData.healthInsurance
      if (validatedData.currentMedications !== undefined) updateData.currentMedications = validatedData.currentMedications
      if (validatedData.allergies !== undefined) updateData.allergies = validatedData.allergies
      if (validatedData.profession !== undefined) updateData.profession = validatedData.profession
      if (validatedData.workplace !== undefined) updateData.workplace = validatedData.workplace

      return await tx.patient.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })
    })

    return NextResponse.json(updatedPatient)
  } catch (error: any) {
    console.error('Erro ao atualizar paciente:', error)

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

    const { id } = params
    const userRole = session.user.role

    // Verificar permissão (apenas admin pode deletar)
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id, isActive: true }
    })

    if (!existingPatient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    // Soft delete do paciente e usuário
    await prisma.$transaction(async (tx) => {
      // Soft delete do paciente
      await tx.patient.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      })

      // Soft delete do usuário
      await tx.user.update({
        where: { id: existingPatient.userId },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      })

      // Soft delete dos dados relacionados
      await Promise.all([
        tx.bodyMap.updateMany({
          where: { patientId: id },
          data: { isActive: false, deletedAt: new Date() }
        }),
        tx.prescription.updateMany({
          where: { patientId: id },
          data: { isActive: false, deletedAt: new Date() }
        }),
        tx.clinicalRecord.updateMany({
          where: { patientId: id },
          data: { isActive: false, deletedAt: new Date() }
        })
      ])
    })

    return NextResponse.json({ message: 'Paciente excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir paciente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}