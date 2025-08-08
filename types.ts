

// --- User & Auth Types ---

export enum Role {
  Admin = 'Admin',
  Therapist = 'Fisioterapeuta',
  Patient = 'Paciente',
  EducadorFisico = 'EducadorFisico',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  patientId?: string;
}

export interface Therapist {
  id: string;
  name: string;
  color: string; // e.g., 'teal', 'sky', 'indigo'
  avatarUrl: string;
}

// --- Patient Related Types ---

export interface Surgery {
  name: string;
  date: string; // YYYY-MM-DD
}

export interface Condition {
  name: string;
  date: string; // YYYY-MM-DD
}

export interface TrackedMetric {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

export interface MetricResult {
  metricId: string;
  value: number;
}

export interface PatientAttachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    phone:string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'Active' | 'Inactive' | 'Discharged';
  lastVisit: string;
  registrationDate: string;
  avatarUrl: string;
  consentGiven: boolean;
  whatsappConsent: 'opt-in' | 'opt-out';
  allergies?: string;
  medicalAlerts?: string;
  surgeries?: Surgery[];
  conditions?: Condition[];
  attachments?: PatientAttachment[];
  trackedMetrics?: TrackedMetric[];
}

export interface PatientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Discharged';
  lastVisit: string;
  avatarUrl: string;
  medicalAlerts?: string;
}

// --- Appointment & Scheduling Types ---

export enum AppointmentStatus {
  Scheduled = 'Agendado',
  Completed = 'Realizado',
  Canceled = 'Cancelado',
  NoShow = 'Faltou'
}

export enum AppointmentType {
    Evaluation = 'Avaliação',
    Session = 'Sessão',
    Return = 'Retorno',
    Teleconsulta = 'Teleconsulta'
}

export interface RecurrenceRule {
    frequency: 'weekly';
    days: number[]; // 0=Sun, 1=Mon, ...
    until: string; // YYYY-MM-DD
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string; // Added for easier access
  therapistId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  type: AppointmentType;
  status: AppointmentStatus;
  value: number;
  paymentStatus: 'paid' | 'pending';
  observations?: string;
  seriesId?: string;
  recurrenceRule?: RecurrenceRule;
  sessionNumber?: number;
  totalSessions?: number;
}

export interface EnrichedAppointment extends Appointment {
    therapistColor: string;
    patientPhone: string;
    patientMedicalAlerts?: string;
}

export interface AvailabilityBlock {
  id: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  title: string; // e.g., 'Almoço', 'Férias'
}

export interface AppointmentHeatmapData {
    day: string;
    '8h': number; '9h': number; '10h': number; '11h': number;
    '12h': number; '13h': number; '14h': number; '15h': number;
    '16h': number; '17h': number; '18h': number; '19h': number;
}

// --- Scheduling Settings Types ---

export interface TimeSlotLimit {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  limit: number;
}

export interface DayLimits {
  weekday: TimeSlotLimit[];
  saturday: TimeSlotLimit[];
}

export interface SchedulingSettings {
  limits: DayLimits;
  maxEvaluationsPerSlot: number;
}


// --- Clinical & Documentation Types ---

export interface SoapNote {
  id: string;
  patientId: string;
  date: string;
  therapist: string;
  sessionNumber?: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  bodyParts?: string[];
  painScale?: number;
  attachments?: { name: string; url: string; }[];
  metricResults?: MetricResult[];
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  coffitoDiagnosisCodes: string;
  treatmentGoals: string;
  frequencyPerWeek: number;
  durationWeeks: number;
  modalities: string[];
  outcomeMeasures: string[];
  createdByCrefito: string;
  exercises?: ExercisePrescription[];
}

export interface ExercisePrescription {
    id: string;
    treatmentPlanId: string;
    exerciseName: string;
    sets: number;
    repetitions: string; // Can be "15" or "30s"
    resistanceLevel: string;
    progressionCriteria: string;
    demonstrationVideoUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
}

export interface LibraryExercise {
  id: string;
  name: string;
  duration: string;
  videoUrl: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  exercises: LibraryExercise[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  bodyParts: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  equipment: string[];
  instructions: string[];
  media: {
    videoUrl?: string;
    thumbnailUrl: string;
    duration?: number; // duration in seconds
  };
  indications?: string[];
  contraindications?: string[];
  modifications?: {
    easier?: string;
    harder?: string;
  };
  status?: 'approved' | 'pending_approval';
  authorId?: string;
}

export interface ClinicalMaterialData {
  nome_material: string;
  tipo_material: 'Escala de Avaliação' | 'Protocolo Clínico' | 'Material de Orientação';
}

export interface MedicalReport {
  id: number;
  patientId: string;
  therapistId: string;
  title: string;
  content: string;
  aiGeneratedContent: string;
  status: 'draft' | 'finalized' | 'sent';
  recipientDoctor?: string;
  recipientCrm?: string;
  generatedAt: Date;
  finalizedAt?: Date;
}


// --- Group & Gamification Types ---

export interface GroupMember {
  patientId: string;
  patientName: string;
  joinDate: string;
  status: 'active' | 'paused';
  level: 'beginner' | 'intermediate' | 'advanced';
  points?: number;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  therapistId: string;
  capacity: {
    max: number;
    current: number;
  };
  members: GroupMember[];
  schedule: {
    days: string[]; // e.g., ["monday", "wednesday", "friday"]
    time: string; // e.g., "08:00"
    duration: number; // in minutes
  };
  exercises: {
    exerciseId: string;
    order: number;
  }[];
  status: 'active' | 'paused' | 'completed';
  gamification?: {
    totalPoints: number;
    level: number;
    badges: string[];
    challenges: {
      id: string;
      title: string;
      description: string;
      progress: number; // 0-100
    }[];
  };
  metrics?: {
    averageAdherence: number;
    averageSatisfaction: number;
    cohesionScore: number;
    progressRate: number;
  };
}

// --- Task Management Types ---

export enum TaskStatus {
  ToDo = 'A Fazer',
  InProgress = 'Em Andamento',
  Done = 'Concluído',
}

export enum TaskPriority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  assignedUserId: string;
  actorUserId: string; // Who created/assigned it
}

// --- Patient Portal Types ---

export interface PainLog {
    id: string;
    patientId: string;
    date: Date;
    painLevel: number;
    notes?: string;
}

export interface Document {
  id: string;
  patientId: string;
  name: string;
  type: 'Atestado' | 'Recibo' | 'Exame';
  issueDate: string;
  url: string;
}

export interface ExerciseEvaluation {
  id: string;
  patientId: string;
  exerciseId: string;
  exerciseName: string;
  date: Date;
  rating: 'easy' | 'medium' | 'hard';
  painLevel: number;
  comments?: string;
}

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: React.ElementType;
};

export interface GamificationProgress {
    points: number;
    level: number;
    xpForNextLevel: number;
    streak: number;
    achievements: Achievement[];
}

// --- UI & General Types ---

export interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  type: 'task_assigned' | 'announcement' | 'appointment_reminder' | 'exercise_reminder';
}

export interface RecentActivity {
  id: string;
  type: 'pain_log' | 'exercise_feedback' | 'new_message';
  patientId: string;
  patientName: string;
  patientAvatarUrl: string;
  summary: string;
  timestamp: Date;
}

// --- Clinical Library Types ---

export interface Material {
  id: string;
  name: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  materials: Material[];
}

// --- Specialty Assessment Types ---

export interface Specialty {
  id: string;
  name: string;
  imageUrl: string;
}

// --- Financial & Partnership Types ---

export enum TransactionType {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export enum ExpenseCategory {
  Aluguel = 'Aluguel',
  Salarios = 'Salários',
  Marketing = 'Marketing',
  Suprimentos = 'Suprimentos',
  Equipamentos = 'Equipamentos',
  Impostos = 'Impostos',
  Outros = 'Outros',
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  date: Date;
  description: string;
  amount: number;
  category: ExpenseCategory | AppointmentType;
  patientName?: string;
  appointmentId?: string;
}

export interface VoucherPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  credits: number; // e.g., number of sessions
  features: string[];
  popular?: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  patientId: string;
  plan: VoucherPlan;
  status: 'activated' | 'expired' | 'cancelled';
  purchaseDate: Date;
  activationDate: Date;
  expiryDate: Date;
  remainingCredits: number;
}

export interface PartnershipClient {
    patient: Patient;
    voucher: Voucher;
}

export interface FinancialSummary {
  grossRevenue: number;
  platformFee: number;
  taxAmount: number;
  netRevenue: number;
  period: string;
}

export interface CommissionBreakdown {
    grossAmount: number;
    platformFee: number;
    taxAmount: number;
    netAmount: number;
}

export interface Transaction {
  id: string;
  type: 'voucher_purchase';
  patientName: string;
  planName: string;
  status: 'completed';
  breakdown: CommissionBreakdown;
  createdAt: Date;
}

// --- AI System Types ---

export enum AIProvider {
    CACHE = 'Cache',
    INTERNAL_KB = 'Base de Conhecimento',
    GEMINI = 'Gemini',
    CHATGPT = 'ChatGPT',
    CLAUDE = 'Claude',
    PERPLEXITY = 'Perplexity',
    MARS = 'Mars',
}

export interface AIResponse {
  content: string;
  source: AIProvider;
}

export interface AIQueryLog extends AIResponse {
    id: number;
    prompt: string;
    timestamp: Date;
}

export interface KnowledgeBaseEntry {
  id: string;
  type: 'protocol' | 'technique' | 'exercise' | 'case';
  title: string;
  content: string;
  tags: string[];
}

// --- WhatsApp Integration Types ---

export interface WhatsappMessage {
    id: string;
    patientId: string;
    patientName: string;
    phone: string;
    type: 'confirmation' | 'reminder' | 'hep' | 'chat';
    content: string;
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: Date;
}
