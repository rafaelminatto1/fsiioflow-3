import { Prisma } from '@prisma/client'

// ========================================
// TIPOS BASE DO PRISMA
// ========================================

export type User = Prisma.UserGetPayload<{}>
export type Patient = Prisma.PatientGetPayload<{}>
export type Clinic = Prisma.ClinicGetPayload<{}>
export type Appointment = Prisma.AppointmentGetPayload<{}>
export type Session = Prisma.SessionGetPayload<{}>
export type BodyMap = Prisma.BodyMapGetPayload<{}>
export type Exercise = Prisma.ExerciseGetPayload<{}>
export type Prescription = Prisma.PrescriptionGetPayload<{}>
export type ClinicalRecord = Prisma.ClinicalRecordGetPayload<{}>
export type Partner = Prisma.PartnerGetPayload<{}>

// ========================================
// TIPOS COM RELACIONAMENTOS
// ========================================

// Usuário com perfil de paciente
export type UserWithPatient = Prisma.UserGetPayload<{
  include: {
    patientProfile: true
  }
}>

// Paciente com dados completos
export type PatientWithDetails = Prisma.PatientGetPayload<{
  include: {
    user: true
    appointments: {
      include: {
        physiotherapist: true
        session: true
      }
    }
    clinicalRecords: {
      include: {
        physiotherapist: true
      }
    }
    bodyMaps: true
    prescriptions: {
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    }
  }
}>

// Agendamento com relacionamentos
export type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: {
    patient: {
      include: {
        user: true
      }
    }
    physiotherapist: true
    session: true
  }
}>

// Sessão com relacionamentos
export type SessionWithDetails = Prisma.SessionGetPayload<{
  include: {
    appointment: {
      include: {
        patient: {
          include: {
            user: true
          }
        }
      }
    }
    physiotherapist: true
  }
}>

// Prescrição com exercícios
export type PrescriptionWithExercises = Prisma.PrescriptionGetPayload<{
  include: {
    patient: {
      include: {
        user: true
      }
    }
    physiotherapist: true
    exercises: {
      include: {
        exercise: true
      }
    }
  }
}>

// Prontuário com relacionamentos
export type ClinicalRecordWithDetails = Prisma.ClinicalRecordGetPayload<{
  include: {
    patient: {
      include: {
        user: true
      }
    }
    physiotherapist: true
  }
}>

// ========================================
// TIPOS PARA FORMS E INPUTS
// ========================================

// Dados para criação de usuário
export type CreateUserInput = Omit<Prisma.UserCreateInput, 'id' | 'createdAt' | 'updatedAt'>

// Dados para criação de paciente
export type CreatePatientInput = Omit<Prisma.PatientCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'user'> & {
  user: CreateUserInput
}

// Dados para atualização de paciente
export type UpdatePatientInput = Partial<Omit<Patient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>

// Dados para criação de agendamento
export type CreateAppointmentInput = Omit<Prisma.AppointmentCreateInput, 'id' | 'createdAt' | 'updatedAt'>

// Dados para criação de sessão
export type CreateSessionInput = Omit<Prisma.SessionCreateInput, 'id' | 'createdAt' | 'updatedAt'>

// Dados para ponto de dor no mapa corporal
export type CreateBodyMapInput = Omit<Prisma.BodyMapCreateInput, 'id' | 'createdAt' | 'updatedAt'>

// Dados para prescrição de exercícios
export type CreatePrescriptionInput = Omit<Prisma.PrescriptionCreateInput, 'id' | 'createdAt' | 'updatedAt'>

// ========================================
// TIPOS PARA FILTROS E BUSCA
// ========================================

// Filtros para busca de pacientes
export interface PatientFilters {
  search?: string
  physiotherapistId?: string
  isActive?: boolean
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Filtros para agendamentos
export interface AppointmentFilters {
  patientId?: string
  physiotherapistId?: string
  status?: Prisma.AppointmentStatus[]
  type?: Prisma.AppointmentType[]
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Filtros para sessões
export interface SessionFilters {
  patientId?: string
  physiotherapistId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// ========================================
// TIPOS PARA DASHBOARD E RELATÓRIOS
// ========================================

// Métricas do dashboard
export interface DashboardMetrics {
  totalPatients: number
  activePatients: number
  totalAppointments: number
  completedSessions: number
  averagePainReduction: number
  revenue: number
}

// Dados para gráficos
export interface ChartData {
  labels: string[]
  data: number[]
  backgroundColor?: string[]
  borderColor?: string[]
}

// Evolução da dor
export interface PainEvolution {
  date: Date
  averageIntensity: number
  pointCount: number
}

// Estatísticas de exercícios
export interface ExerciseStats {
  exerciseId: string
  exerciseName: string
  timesPrescibed: number
  averageAdherence: number
}

// ========================================
// TIPOS PARA COORDENADAS DO MAPA CORPORAL
// ========================================

export interface BodyMapCoordinates {
  x: number // 0-100 (porcentagem)
  y: number // 0-100 (porcentagem)
}

export interface PainPoint extends BodyMapCoordinates {
  intensity: number // 0-10
  painType: Prisma.PainType
  side: Prisma.BodySide
  bodyPart: string
  description?: string
  notes?: string
  date: Date
}

// ========================================
// TIPOS PARA DADOS MÉDICOS (JSON)
// ========================================

// Estrutura do endereço
export interface Address {
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zipCode: string
}

// Estrutura do plano de saúde
export interface HealthInsurance {
  name: string
  cardNumber: string
  expiryDate: Date
  type: 'PARTICULAR' | 'CONVENIO' | 'SUS'
}

// Estrutura do histórico médico
export interface MedicalHistory {
  previousSurgeries?: string[]
  chronicDiseases?: string[]
  familyHistory?: string[]
  currentSymptoms?: string[]
  painHistory?: {
    startDate: Date
    location: string
    characteristics: string[]
    triggers?: string[]
    relievingFactors?: string[]
  }[]
}

// Estrutura da avaliação inicial
export interface InitialAssessment {
  chiefComplaint: string
  painScale: number
  functionalLimitations: string[]
  previousTreatments?: string[]
  expectations: string[]
  physicalExam: {
    inspection: string
    palpation: string
    movementTests: Record<string, string>
    specialTests: Record<string, boolean>
  }
}

// Estrutura do plano de tratamento
export interface TreatmentPlan {
  shortTermGoals: string[]
  longTermGoals: string[]
  interventions: string[]
  frequency: string
  estimatedDuration: string
  contraindications?: string[]
}

// ========================================
// TIPOS PARA VALIDAÇÃO
// ========================================

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Validação de CPF
export type ValidCPF = string & { readonly __brand: unique symbol }

// Validação de email
export type ValidEmail = string & { readonly __brand: unique symbol }

// Validação de telefone
export type ValidPhone = string & { readonly __brand: unique symbol }

