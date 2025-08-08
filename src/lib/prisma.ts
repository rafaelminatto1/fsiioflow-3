import { PrismaClient } from '@prisma/client'

// Configuração otimizada do Prisma Client para FisioFlow
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Prevenção de múltiplas instâncias em desenvolvimento
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Extensões do Prisma para funcionalidades específicas
export const extendedPrisma = prisma.$extends({
  model: {
    user: {
      // Buscar usuários ativos por role
      async findManyByRole(role: string) {
        return prisma.user.findMany({
          where: {
            role: role as any,
            isActive: true,
            deletedAt: null
          }
        })
      },

      // Buscar fisioterapeutas disponíveis
      async findAvailablePhysiotherapists() {
        return prisma.user.findMany({
          where: {
            role: 'FISIOTERAPEUTA',
            isActive: true,
            deletedAt: null
          },
          include: {
            appointments: {
              where: {
                dateTime: {
                  gte: new Date()
                },
                status: {
                  in: ['AGENDADO', 'CONFIRMADO']
                }
              }
            }
          }
        })
      }
    },

    patient: {
      // Buscar pacientes com informações completas
      async findWithDetails(patientId: string) {
        return prisma.patient.findUnique({
          where: { id: patientId, isActive: true },
          include: {
            user: true,
            appointments: {
              include: {
                physiotherapist: true,
                session: true
              },
              orderBy: { dateTime: 'desc' }
            },
            clinicalRecords: {
              include: {
                physiotherapist: true
              },
              orderBy: { createdAt: 'desc' }
            },
            bodyMaps: {
              orderBy: { recordedAt: 'desc' }
            },
            prescriptions: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              },
              where: { isActive: true }
            }
          }
        })
      },

      // Buscar pacientes ativos com filtros
      async findActiveWithFilters(filters: {
        search?: string
        physiotherapistId?: string
        limit?: number
        offset?: number
      }) {
        const { search, physiotherapistId, limit = 20, offset = 0 } = filters

        return prisma.patient.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            ...(search && {
              OR: [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { cpf: { contains: search } }
              ]
            }),
            ...(physiotherapistId && {
              appointments: {
                some: {
                  physiotherapistId
                }
              }
            })
          },
          include: {
            user: true,
            appointments: {
              take: 5,
              orderBy: { dateTime: 'desc' },
              include: {
                physiotherapist: true
              }
            }
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        })
      }
    },

    bodyMap: {
      // Buscar evolução da dor de um paciente
      async findPainEvolution(patientId: string, days: number = 30) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        return prisma.bodyMap.findMany({
          where: {
            patientId,
            isActive: true,
            recordedAt: {
              gte: startDate
            }
          },
          orderBy: { recordedAt: 'asc' }
        })
      },

      // Buscar pontos de dor mais comuns
      async findCommonPainPoints(clinicId?: string) {
        const result = await prisma.bodyMap.groupBy({
          by: ['bodyPart'],
          where: {
            isActive: true,
            ...(clinicId && {
              patient: {
                user: {
                  clinics: {
                    some: { id: clinicId }
                  }
                }
              }
            })
          },
          _count: {
            bodyPart: true
          },
          _avg: {
            intensity: true
          },
          orderBy: {
            _count: {
              bodyPart: 'desc'
            }
          }
        })

        return result
      }
    }
  }
})

// Cleanup automático da conexão
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma

