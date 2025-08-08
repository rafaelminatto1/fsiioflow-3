// ========================================
// CONSTANTES DE ROLES E PERMISSÕES
// ========================================

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  FISIOTERAPEUTA: 'FISIOTERAPEUTA',
  ESTAGIARIO: 'ESTAGIARIO',
  PACIENTE: 'PACIENTE',
  PARCEIRO: 'PARCEIRO'
} as const

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.FISIOTERAPEUTA]: 'Fisioterapeuta',
  [USER_ROLES.ESTAGIARIO]: 'Estagiário',
  [USER_ROLES.PACIENTE]: 'Paciente',
  [USER_ROLES.PARCEIRO]: 'Parceiro'
} as const

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'manage_patients',
    'manage_appointments',
    'manage_exercises',
    'view_reports',
    'manage_clinic_settings'
  ],
  [USER_ROLES.FISIOTERAPEUTA]: [
    'manage_patients',
    'manage_appointments',
    'manage_exercises',
    'create_prescriptions',
    'view_patient_reports'
  ],
  [USER_ROLES.ESTAGIARIO]: [
    'view_patients',
    'create_appointments',
    'view_exercises'
  ],
  [USER_ROLES.PACIENTE]: [
    'view_own_data',
    'view_own_appointments',
    'view_own_exercises'
  ],
  [USER_ROLES.PARCEIRO]: [
    'view_shared_patients',
    'create_exercise_recommendations'
  ]
} as const

// ========================================
// CONSTANTES DE STATUS
// ========================================

export const APPOINTMENT_STATUS = {
  AGENDADO: 'AGENDADO',
  CONFIRMADO: 'CONFIRMADO',
  ATENDIDO: 'ATENDIDO',
  FALTOU: 'FALTOU',
  CANCELADO: 'CANCELADO',
  REAGENDADO: 'REAGENDADO'
} as const

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.AGENDADO]: 'Agendado',
  [APPOINTMENT_STATUS.CONFIRMADO]: 'Confirmado',
  [APPOINTMENT_STATUS.ATENDIDO]: 'Atendido',
  [APPOINTMENT_STATUS.FALTOU]: 'Faltou',
  [APPOINTMENT_STATUS.CANCELADO]: 'Cancelado',
  [APPOINTMENT_STATUS.REAGENDADO]: 'Reagendado'
} as const

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUS.AGENDADO]: 'bg-blue-100 text-blue-800',
  [APPOINTMENT_STATUS.CONFIRMADO]: 'bg-green-100 text-green-800',
  [APPOINTMENT_STATUS.ATENDIDO]: 'bg-emerald-100 text-emerald-800',
  [APPOINTMENT_STATUS.FALTOU]: 'bg-red-100 text-red-800',
  [APPOINTMENT_STATUS.CANCELADO]: 'bg-gray-100 text-gray-800',
  [APPOINTMENT_STATUS.REAGENDADO]: 'bg-yellow-100 text-yellow-800'
} as const

export const APPOINTMENT_TYPES = {
  AVALIACAO: 'AVALIACAO',
  SESSAO: 'SESSAO',
  RETORNO: 'RETORNO',
  REAVALIACAO: 'REAVALIACAO'
} as const

export const APPOINTMENT_TYPE_LABELS = {
  [APPOINTMENT_TYPES.AVALIACAO]: 'Avaliação',
  [APPOINTMENT_TYPES.SESSAO]: 'Sessão',
  [APPOINTMENT_TYPES.RETORNO]: 'Retorno',
  [APPOINTMENT_TYPES.REAVALIACAO]: 'Reavaliação'
} as const

// ========================================
// CONSTANTES DE DOR E MAPA CORPORAL
// ========================================

export const PAIN_TYPES = {
  DOR: 'DOR',
  DESCONFORTO: 'DESCONFORTO',
  RIGIDEZ: 'RIGIDEZ',
  FORMIGAMENTO: 'FORMIGAMENTO',
  DORMENCIA: 'DORMENCIA',
  QUEIMACAO: 'QUEIMACAO'
} as const

export const PAIN_TYPE_LABELS = {
  [PAIN_TYPES.DOR]: 'Dor',
  [PAIN_TYPES.DESCONFORTO]: 'Desconforto',
  [PAIN_TYPES.RIGIDEZ]: 'Rigidez',
  [PAIN_TYPES.FORMIGAMENTO]: 'Formigamento',
  [PAIN_TYPES.DORMENCIA]: 'Dormência',
  [PAIN_TYPES.QUEIMACAO]: 'Queimação'
} as const

export const BODY_SIDES = {
  FRONT: 'FRONT',
  BACK: 'BACK'
} as const

export const BODY_SIDE_LABELS = {
  [BODY_SIDES.FRONT]: 'Frente',
  [BODY_SIDES.BACK]: 'Costas'
} as const

export const PAIN_SCALE_COLORS = {
  0: '#f3f4f6', // Cinza claro
  1: '#dcfce7', // Verde muito claro
  2: '#bbf7d0', // Verde claro
  3: '#86efac', // Verde
  4: '#fef3c7', // Amarelo claro
  5: '#fde68a', // Amarelo
  6: '#fed7aa', // Laranja claro
  7: '#fdba74', // Laranja
  8: '#fca5a5', // Vermelho claro
  9: '#f87171', // Vermelho
  10: '#dc2626' // Vermelho escuro
} as const

export const PAIN_SCALE_LABELS = {
  0: 'Sem dor',
  1: 'Dor muito leve',
  2: 'Dor leve',
  3: 'Dor leve a moderada',
  4: 'Dor moderada',
  5: 'Dor moderada a intensa',
  6: 'Dor intensa',
  7: 'Dor muito intensa',
  8: 'Dor severa',
  9: 'Dor muito severa',
  10: 'Dor insuportável'
} as const

// ========================================
// CONSTANTES DE EXERCÍCIOS
// ========================================

export const EXERCISE_CATEGORIES = {
  MOBILIZACAO_NEURAL: 'MOBILIZACAO_NEURAL',
  CERVICAL: 'CERVICAL',
  MEMBROS_SUPERIORES: 'MEMBROS_SUPERIORES',
  TRONCO: 'TRONCO',
  MEMBROS_INFERIORES: 'MEMBROS_INFERIORES',
  FORTALECIMENTO: 'FORTALECIMENTO',
  ALONGAMENTO: 'ALONGAMENTO',
  PROPRIOCEPCAO: 'PROPRIOCEPCAO',
  CARDIORRESPIRATORIO: 'CARDIORRESPIRATORIO',
  FUNCIONAL: 'FUNCIONAL'
} as const

export const EXERCISE_CATEGORY_LABELS = {
  [EXERCISE_CATEGORIES.MOBILIZACAO_NEURAL]: 'Mobilização Neural',
  [EXERCISE_CATEGORIES.CERVICAL]: 'Cervical',
  [EXERCISE_CATEGORIES.MEMBROS_SUPERIORES]: 'Membros Superiores',
  [EXERCISE_CATEGORIES.TRONCO]: 'Tronco',
  [EXERCISE_CATEGORIES.MEMBROS_INFERIORES]: 'Membros Inferiores',
  [EXERCISE_CATEGORIES.FORTALECIMENTO]: 'Fortalecimento',
  [EXERCISE_CATEGORIES.ALONGAMENTO]: 'Alongamento',
  [EXERCISE_CATEGORIES.PROPRIOCEPCAO]: 'Propriocepção',
  [EXERCISE_CATEGORIES.CARDIORRESPIRATORIO]: 'Cardiorrespiratório',
  [EXERCISE_CATEGORIES.FUNCIONAL]: 'Funcional'
} as const

export const EXERCISE_DIFFICULTY_LABELS = {
  1: 'Muito Fácil',
  2: 'Fácil',
  3: 'Moderado',
  4: 'Difícil',
  5: 'Muito Difícil'
} as const

export const PRESCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED'
} as const

export const PRESCRIPTION_STATUS_LABELS = {
  [PRESCRIPTION_STATUS.ACTIVE]: 'Ativo',
  [PRESCRIPTION_STATUS.COMPLETED]: 'Concluído',
  [PRESCRIPTION_STATUS.PAUSED]: 'Pausado',
  [PRESCRIPTION_STATUS.CANCELLED]: 'Cancelado'
} as const

// ========================================
// CONSTANTES DE NAVEGAÇÃO
// ========================================

export const NAVIGATION_ITEMS = {
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  APPOINTMENTS: '/appointments',
  EXERCISES: '/exercises',
  BODY_MAP: '/body-map',
  REPORTS: '/reports',
  SETTINGS: '/settings'
} as const

export const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    href: NAVIGATION_ITEMS.DASHBOARD,
    icon: 'LayoutDashboard',
    roles: [USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA, USER_ROLES.ESTAGIARIO]
  },
  {
    label: 'Pacientes',
    href: NAVIGATION_ITEMS.PATIENTS,
    icon: 'Users',
    roles: [USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA, USER_ROLES.ESTAGIARIO]
  },
  {
    label: 'Agendamentos',
    href: NAVIGATION_ITEMS.APPOINTMENTS,
    icon: 'Calendar',
    roles: [USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA, USER_ROLES.ESTAGIARIO]
  },
  {
    label: 'Exercícios',
    href: NAVIGATION_ITEMS.EXERCISES,
    icon: 'Dumbbell',
    roles: [USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA, USER_ROLES.ESTAGIARIO, USER_ROLES.PARCEIRO]
  },
  {
    label: 'Mapa Corporal',
    href: NAVIGATION_ITEMS.BODY_MAP,
    icon: 'User',
    roles: [USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA]
  },
  {
    label: 'Relatórios',
    href: NAVIGATION_ITEMS.REPORTS,
    icon: 'FileText',
    roles: [USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA]
  },
  {
    label: 'Configurações',
    href: NAVIGATION_ITEMS.SETTINGS,
    icon: 'Settings',
    roles: [USER_ROLES.ADMIN]
  }
] as const

// ========================================
// CONSTANTES DE PAGINAÇÃO
// ========================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const

// ========================================
// CONSTANTES DE VALIDAÇÃO
// ========================================

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  DESCRIPTION_MAX_LENGTH: 1000,
  NOTES_MAX_LENGTH: 500,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 11,
  CPF_LENGTH: 11,
  CEP_LENGTH: 8
} as const

// ========================================
// CONSTANTES DE FORMATO
// ========================================

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd \'de\' MMMM \'de\' yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-dd'
} as const

export const CURRENCY_FORMAT = {
  LOCALE: 'pt-BR',
  CURRENCY: 'BRL'
} as const

// ========================================
// CONSTANTES DE API
// ========================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh'
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    BY_ROLE: (role: string) => `/api/users?role=${role}`
  },
  PATIENTS: {
    BASE: '/api/patients',
    BY_ID: (id: string) => `/api/patients/${id}`,
    SEARCH: '/api/patients/search',
    STATS: '/api/patients/stats'
  },
  APPOINTMENTS: {
    BASE: '/api/appointments',
    BY_ID: (id: string) => `/api/appointments/${id}`,
    STATS: '/api/appointments/stats'
  },
  BODY_MAP: {
    BASE: '/api/body-map',
    BY_PATIENT: (patientId: string) => `/api/body-map?patientId=${patientId}`
  },
  EXERCISES: {
    BASE: '/api/exercises',
    BY_ID: (id: string) => `/api/exercises/${id}`,
    BY_CATEGORY: (category: string) => `/api/exercises?category=${category}`
  },
  PRESCRIPTIONS: {
    BASE: '/api/prescriptions',
    BY_ID: (id: string) => `/api/prescriptions/${id}`,
    BY_PATIENT: (patientId: string) => `/api/prescriptions?patientId=${patientId}`
  }
} as const

// ========================================
// CONSTANTES DE TIMEOUT E RETRY
// ========================================

export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 segundo
} as const

// ========================================
// CONSTANTES DE CACHE
// ========================================

export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  DASHBOARD_STATS: 'dashboard_stats',
  PATIENT_LIST: 'patient_list',
  EXERCISE_LIBRARY: 'exercise_library'
} as const

export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutos
  MEDIUM: 30 * 60, // 30 minutos
  LONG: 24 * 60 * 60 // 24 horas
} as const

// ========================================
// CONSTANTES DE TEMA E ESTILO
// ========================================

export const THEME_COLORS = {
  PRIMARY: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    900: '#0c4a6e'
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    900: '#14532d'
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    900: '#92400e'
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    900: '#991b1b'
  }
} as const

// ========================================
// CONSTANTES DE NOTIFICAÇÃO
// ========================================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000
} as const

