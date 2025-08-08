import { z } from 'zod'

// ========================================
// VALIDAÇÕES BÁSICAS
// ========================================

// Validação de CPF
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF inválido')
  .refine((cpf) => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false
    
    // Verifica se não são todos os dígitos iguais
    if (/^(\d)\1+$/.test(cleanCPF)) return false
    
    // Validação do algoritmo do CPF
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }, 'CPF inválido')

// Validação de telefone brasileiro
export const phoneSchema = z
  .string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone inválido')
  .refine((phone) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 11
  }, 'Formato de telefone inválido')

// Validação de CEP
export const cepSchema = z
  .string()
  .min(8, 'CEP deve ter 8 dígitos')
  .max(9, 'CEP inválido')
  .refine((cep) => {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.length === 8
  }, 'CEP inválido')

// ========================================
// SCHEMAS DE ENDEREÇO
// ========================================

export const addressSchema = z.object({
  street: z.string().min(1, 'Logradouro é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  district: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zipCode: cepSchema
})

// ========================================
// SCHEMAS DE USUÁRIO
// ========================================

export const userRoleSchema = z.enum(['ADMIN', 'FISIOTERAPEUTA', 'ESTAGIARIO', 'PACIENTE', 'PARCEIRO'])

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: userRoleSchema,
  crefito: z.string().optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().url().optional()
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

// ========================================
// SCHEMAS DE PACIENTE
// ========================================

export const healthInsuranceSchema = z.object({
  name: z.string().min(1, 'Nome do plano é obrigatório'),
  cardNumber: z.string().min(1, 'Número da carteira é obrigatório'),
  expiryDate: z.date(),
  type: z.enum(['PARTICULAR', 'CONVENIO', 'SUS'])
})

export const createPatientSchema = z.object({
  // Dados do usuário
  user: createUserSchema.extend({
    role: z.literal('PACIENTE')
  }),
  
  // Documentos
  cpf: cpfSchema,
  rg: z.string().optional(),
  birthDate: z.date(),
  
  // Contatos
  phone: phoneSchema,
  email: z.string().email('Email inválido'),
  emergencyContact: z.string().optional(),
  
  // Endereço
  address: addressSchema,
  
  // Plano de saúde
  healthInsurance: healthInsuranceSchema.optional(),
  
  // Informações médicas
  medicalHistory: z.record(z.any()).optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  
  // Informações profissionais
  profession: z.string().optional(),
  workplace: z.string().optional()
})

export const updatePatientSchema = createPatientSchema.partial().omit({ user: true })

// ========================================
// SCHEMAS DE AGENDAMENTO
// ========================================

export const appointmentStatusSchema = z.enum([
  'AGENDADO', 'CONFIRMADO', 'ATENDIDO', 'FALTOU', 'CANCELADO', 'REAGENDADO'
])

export const appointmentTypeSchema = z.enum([
  'AVALIACAO', 'SESSAO', 'RETORNO', 'REAVALIACAO'
])

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  physiotherapistId: z.string().uuid(),
  dateTime: z.date(),
  duration: z.number().min(15).max(180).default(60),
  status: appointmentStatusSchema.default('AGENDADO'),
  type: appointmentTypeSchema.default('SESSAO'),
  value: z.number().positive().optional(),
  paymentMethod: z.string().optional(),
  isPaid: z.boolean().default(false),
  notes: z.string().optional(),
  observations: z.string().optional()
})

export const updateAppointmentSchema = createAppointmentSchema.partial()

// ========================================
// SCHEMAS DE SESSÃO
// ========================================

export const createSessionSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  physiotherapistId: z.string().uuid(),
  sessionNumber: z.number().positive(),
  objectives: z.array(z.string()),
  procedures: z.record(z.any()),
  techniques: z.array(z.string()),
  patientResponse: z.string().optional(),
  evolution: z.string().optional(),
  painBefore: z.number().min(0).max(10).optional(),
  painAfter: z.number().min(0).max(10).optional(),
  exercisesPerformed: z.record(z.any()).optional(),
  homeExercises: z.string().optional(),
  recommendations: z.string().optional(),
  nextSessionPlan: z.string().optional()
})

export const updateSessionSchema = createSessionSchema.partial()

// ========================================
// SCHEMAS DE MAPA CORPORAL
// ========================================

export const painTypeSchema = z.enum([
  'DOR', 'DESCONFORTO', 'RIGIDEZ', 'FORMIGAMENTO', 'DORMENCIA', 'QUEIMACAO'
])

export const bodySideSchema = z.enum(['FRONT', 'BACK'])

export const createBodyMapSchema = z.object({
  patientId: z.string().uuid(),
  coordinates: z.string(), // Formato PostgreSQL POINT
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  intensity: z.number().min(0).max(10),
  painType: painTypeSchema.default('DOR'),
  side: bodySideSchema.default('FRONT'),
  bodyPart: z.string().min(1, 'Parte do corpo é obrigatória'),
  description: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.date().default(() => new Date())
})

export const updateBodyMapSchema = createBodyMapSchema.partial()

// ========================================
// SCHEMAS DE EXERCÍCIOS
// ========================================

export const exerciseCategorySchema = z.enum([
  'MOBILIZACAO_NEURAL',
  'CERVICAL',
  'MEMBROS_SUPERIORES',
  'TRONCO',
  'MEMBROS_INFERIORES',
  'FORTALECIMENTO',
  'ALONGAMENTO',
  'PROPRIOCEPCAO',
  'CARDIORRESPIRATORIO',
  'FUNCIONAL'
])

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: exerciseCategorySchema,
  description: z.string().min(1, 'Descrição é obrigatória'),
  instructions: z.string().min(1, 'Instruções são obrigatórias'),
  videoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  defaultSets: z.number().positive().default(3),
  defaultReps: z.string().default('10-15'),
  defaultRest: z.number().positive().default(60),
  indications: z.array(z.string()),
  contraindications: z.array(z.string()),
  equipment: z.array(z.string()),
  difficulty: z.number().min(1).max(5).default(1)
})

export const updateExerciseSchema = createExerciseSchema.partial()

// ========================================
// SCHEMAS DE PRESCRIÇÃO
// ========================================

export const prescriptionStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'])

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  physiotherapistId: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  frequency: z.string().min(1, 'Frequência é obrigatória'),
  generalNotes: z.string().optional(),
  status: prescriptionStatusSchema.default('ACTIVE')
})

export const createPrescriptionExerciseSchema = z.object({
  prescriptionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sets: z.number().positive(),
  reps: z.string().min(1, 'Repetições são obrigatórias'),
  rest: z.number().positive(),
  specificNotes: z.string().optional(),
  order: z.number().positive().default(1)
})

// ========================================
// SCHEMAS DE FILTROS
// ========================================

export const patientFiltersSchema = z.object({
  search: z.string().optional(),
  physiotherapistId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

export const appointmentFiltersSchema = z.object({
  patientId: z.string().uuid().optional(),
  physiotherapistId: z.string().uuid().optional(),
  status: z.array(appointmentStatusSchema).optional(),
  type: z.array(appointmentTypeSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

// ========================================
// SCHEMAS DE RELATÓRIOS
// ========================================

export const reportDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine((data) => data.startDate <= data.endDate, {
  message: 'Data inicial deve ser anterior à data final',
  path: ['endDate']
})

export const dashboardFiltersSchema = z.object({
  clinicId: z.string().uuid().optional(),
  physiotherapistId: z.string().uuid().optional(),
  dateRange: reportDateRangeSchema.optional()
})

// ========================================
// UTILITÁRIOS DE VALIDAÇÃO
// ========================================

// Função para validar e sanitizar dados
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

// Função para validação segura (retorna erro em vez de throw)
export function safeValidate<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  return result
}

// Middleware para validação de request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: result.error.errors
      })
    }
    req.validatedBody = result.data
    next()
  }
}

// Validação de query parameters
export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.query)
    if (!result.success) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: result.error.errors
      })
    }
    req.validatedQuery = result.data
    next()
  }
}

