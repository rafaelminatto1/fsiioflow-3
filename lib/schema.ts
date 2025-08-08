// lib/schema.ts - Optimized database schema based on existing types
import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal, 
  jsonb,
  pgEnum,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['Admin', 'Fisioterapeuta', 'Paciente', 'EducadorFisico']);
export const patientStatusEnum = pgEnum('patient_status', ['Active', 'Inactive', 'Discharged']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['Agendado', 'Realizado', 'Cancelado', 'Faltou']);
export const appointmentTypeEnum = pgEnum('appointment_type', ['Avaliação', 'Sessão', 'Retorno', 'Teleconsulta']);
export const whatsappConsentEnum = pgEnum('whatsapp_consent', ['opt-in', 'opt-out']);
export const taskStatusEnum = pgEnum('task_status', ['A Fazer', 'Em Andamento', 'Concluído']);
export const taskPriorityEnum = pgEnum('task_priority', ['Alta', 'Média', 'Baixa']);
export const transactionTypeEnum = pgEnum('transaction_type', ['Receita', 'Despesa']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  role: roleEnum('role').notNull(),
  avatarUrl: text('avatar_url'),
  patientId: uuid('patient_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Therapists table
export const therapists = pgTable('therapists', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Patients table - optimized for frequent queries
export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).unique().notNull(),
  birthDate: varchar('birth_date', { length: 10 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  
  // Emergency contact as JSON for flexibility
  emergencyContact: jsonb('emergency_contact').$type<{
    name: string;
    phone: string;
  }>(),
  
  // Address as JSON
  address: jsonb('address').$type<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>(),
  
  status: patientStatusEnum('status').notNull().default('Active'),
  lastVisit: varchar('last_visit', { length: 10 }),
  registrationDate: varchar('registration_date', { length: 10 }).notNull(),
  avatarUrl: text('avatar_url'),
  consentGiven: boolean('consent_given').default(false),
  whatsappConsent: whatsappConsentEnum('whatsapp_consent').default('opt-out'),
  allergies: text('allergies'),
  medicalAlerts: text('medical_alerts'),
  
  // Arrays as JSON for better performance than separate tables for simple data
  surgeries: jsonb('surgeries').$type<Array<{ name: string; date: string }>>(),
  conditions: jsonb('conditions').$type<Array<{ name: string; date: string }>>(),
  attachments: jsonb('attachments').$type<Array<{ 
    name: string; 
    url: string; 
    type: string; 
    size: number; 
  }>>(),
  trackedMetrics: jsonb('tracked_metrics').$type<Array<{
    id: string;
    name: string;
    unit: string;
    isActive: boolean;
  }>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('patients_name_idx').on(table.name),
  cpfIdx: index('patients_cpf_idx').on(table.cpf),
  statusIdx: index('patients_status_idx').on(table.status),
  lastVisitIdx: index('patients_last_visit_idx').on(table.lastVisit),
  registrationDateIdx: index('patients_registration_date_idx').on(table.registrationDate),
  // Composite index for common queries
  statusLastVisitIdx: index('patients_status_last_visit_idx').on(table.status, table.lastVisit),
}));

// Appointments table - heavily optimized for scheduling queries
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  therapistId: uuid('therapist_id').notNull().references(() => therapists.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: appointmentTypeEnum('type').notNull(),
  status: appointmentStatusEnum('status').notNull().default('Agendado'),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'),
  observations: text('observations'),
  seriesId: varchar('series_id', { length: 100 }),
  recurrenceRule: jsonb('recurrence_rule').$type<{
    frequency: 'weekly';
    days: number[];
    until: string;
  }>(),
  sessionNumber: integer('session_number'),
  totalSessions: integer('total_sessions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientIdx: index('appointments_patient_idx').on(table.patientId),
  therapistIdx: index('appointments_therapist_idx').on(table.therapistId),
  startTimeIdx: index('appointments_start_time_idx').on(table.startTime),
  statusIdx: index('appointments_status_idx').on(table.status),
  typeIdx: index('appointments_type_idx').on(table.type),
  // Critical composite indexes for dashboard queries
  patientStartTimeIdx: index('appointments_patient_start_time_idx').on(table.patientId, table.startTime),
  therapistStartTimeIdx: index('appointments_therapist_start_time_idx').on(table.therapistId, table.startTime),
  statusStartTimeIdx: index('appointments_status_start_time_idx').on(table.status, table.startTime),
  // For revenue calculations
  statusValueIdx: index('appointments_status_value_idx').on(table.status, table.value),
}));

// SOAP Notes table
export const soapNotes = pgTable('soap_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  date: varchar('date', { length: 10 }).notNull(),
  therapist: varchar('therapist', { length: 255 }).notNull(),
  sessionNumber: integer('session_number'),
  subjective: text('subjective').notNull(),
  objective: text('objective').notNull(),
  assessment: text('assessment').notNull(),
  plan: text('plan').notNull(),
  bodyParts: jsonb('body_parts').$type<string[]>(),
  painScale: integer('pain_scale'),
  attachments: jsonb('attachments').$type<Array<{ name: string; url: string }>>(),
  metricResults: jsonb('metric_results').$type<Array<{ metricId: string; value: number }>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientIdx: index('soap_notes_patient_idx').on(table.patientId),
  dateIdx: index('soap_notes_date_idx').on(table.date),
  patientDateIdx: index('soap_notes_patient_date_idx').on(table.patientId, table.date),
}));

// Treatment Plans table
export const treatmentPlans = pgTable('treatment_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  coffitoDiagnosisCodes: text('coffito_diagnosis_codes').notNull(),
  treatmentGoals: text('treatment_goals').notNull(),
  frequencyPerWeek: integer('frequency_per_week').notNull(),
  durationWeeks: integer('duration_weeks').notNull(),
  modalities: jsonb('modalities').$type<string[]>(),
  outcomeMeasures: jsonb('outcome_measures').$type<string[]>(),
  createdByCrefito: varchar('created_by_crefito', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientIdx: index('treatment_plans_patient_idx').on(table.patientId),
}));

// Exercise Prescriptions table
export const exercisePrescriptions = pgTable('exercise_prescriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  treatmentPlanId: uuid('treatment_plan_id').notNull().references(() => treatmentPlans.id),
  exerciseName: varchar('exercise_name', { length: 255 }).notNull(),
  sets: integer('sets').notNull(),
  repetitions: varchar('repetitions', { length: 50 }).notNull(),
  resistanceLevel: varchar('resistance_level', { length: 100 }).notNull(),
  progressionCriteria: text('progression_criteria').notNull(),
  demonstrationVideoUrl: text('demonstration_video_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  treatmentPlanIdx: index('exercise_prescriptions_treatment_plan_idx').on(table.treatmentPlanId),
}));

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('A Fazer'),
  priority: taskPriorityEnum('priority').notNull().default('Média'),
  dueDate: varchar('due_date', { length: 10 }),
  assignedUserId: uuid('assigned_user_id').notNull(),
  actorUserId: uuid('actor_user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  assignedUserIdx: index('tasks_assigned_user_idx').on(table.assignedUserId),
  statusIdx: index('tasks_status_idx').on(table.status),
  dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
}));

// Audit Logs table - optimized for append-only workload
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  user: varchar('user', { length: 255 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('audit_logs_user_idx').on(table.user),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
}));

// Financial Transactions table
export const financialTransactions = pgTable('financial_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: transactionTypeEnum('type').notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  patientName: varchar('patient_name', { length: 255 }),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('financial_transactions_type_idx').on(table.type),
  dateIdx: index('financial_transactions_date_idx').on(table.date),
  categoryIdx: index('financial_transactions_category_idx').on(table.category),
  // For dashboard revenue calculations
  typeDateIdx: index('financial_transactions_type_date_idx').on(table.type, table.date),
}));

// Body Map: Evolutions per session (ties to patient and optionally appointment/soap note)
export const bodyMapEvolutions = pgTable('body_map_evolutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  soapNoteId: uuid('soap_note_id').references(() => soapNotes.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  generalNotes: text('general_notes'),
}, (table) => ({
  patientIdx: index('body_map_evolutions_patient_idx').on(table.patientId),
  patientCreatedIdx: index('body_map_evolutions_patient_created_idx').on(table.patientId, table.createdAt),
}));

// Body Map: Regions captured in each evolution
export const bodyMapRegions = pgTable('body_map_regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  bodyMapEvolutionId: uuid('body_map_evolution_id').notNull().references(() => bodyMapEvolutions.id, { onDelete: 'cascade' }),

  // Anatomical identification
  regionCode: varchar('region_code', { length: 120 }).notNull(),
  regionName: varchar('region_name', { length: 200 }).notNull(),
  anatomicalGroup: varchar('anatomical_group', { length: 120 }).notNull(),
  side: varchar('side', { length: 20 }), // 'direito' | 'esquerdo' | 'bilateral' | null

  // Symptoms
  symptomType: jsonb('symptom_type').$type<string[]>().notNull(),
  painIntensity: integer('pain_intensity').notNull(), // 0-10
  painCharacteristic: jsonb('pain_characteristic').$type<string[]>().notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),

  // Tracking
  onsetDate: timestamp('onset_date').notNull(),
  firstReportDate: timestamp('first_report_date').notNull(),

  // Clinical data
  mechanism: text('mechanism'),
  aggravatingFactors: jsonb('aggravating_factors').$type<string[]>(),
  relievingFactors: jsonb('relieving_factors').$type<string[]>(),
  irradiationTo: jsonb('irradiation_to').$type<string[]>(), // region codes

  // Status
  isActive: boolean('is_active').notNull().default(true),
  isImproved: boolean('is_improved').notNull().default(false),
  improvementPercentage: integer('improvement_percentage'), // 0-100

  // Objective measures
  romLimitation: jsonb('rom_limitation').$type<Record<string, unknown>>(),
  muscleStrength: integer('muscle_strength'), // 0-5
  specialTests: jsonb('special_tests').$type<Record<string, unknown>>(),
}, (table) => ({
  evolutionIdx: index('body_map_regions_evolution_idx').on(table.bodyMapEvolutionId),
  regionInEvolutionIdx: index('body_map_regions_code_evolution_idx').on(table.regionCode, table.bodyMapEvolutionId),
}));

// Aggregated region history per patient
export const regionHistories = pgTable('region_histories', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  regionCode: varchar('region_code', { length: 120 }).notNull(),

  totalTreatmentDays: integer('total_treatment_days').notNull().default(0),
  sessionsCount: integer('sessions_count').notNull().default(0),
  averageIntensity: decimal('average_intensity', { precision: 5, scale: 2 }).notNull().default('0'),
  maxIntensity: integer('max_intensity').notNull().default(0),
  minIntensity: integer('min_intensity').notNull().default(0),

  firstOccurrence: timestamp('first_occurrence').notNull(),
  lastOccurrence: timestamp('last_occurrence').notNull(),
  resolutionDate: timestamp('resolution_date'),
  recurrences: integer('recurrences').notNull().default(0),
}, (table) => ({
  uniquePatientRegion: index('region_histories_unique_patient_region_idx').on(table.patientId, table.regionCode),
}));

// Relations for better query optimization
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  soapNotes: many(soapNotes),
  treatmentPlans: many(treatmentPlans),
  bodyMapEvolutions: many(bodyMapEvolutions),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  therapist: one(therapists, {
    fields: [appointments.therapistId],
    references: [therapists.id],
  }),
}));

export const soapNotesRelations = relations(soapNotes, ({ one }) => ({
  patient: one(patients, {
    fields: [soapNotes.patientId],
    references: [patients.id],
  }),
}));

export const treatmentPlansRelations = relations(treatmentPlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [treatmentPlans.patientId],
    references: [patients.id],
  }),
  exercisePrescriptions: many(exercisePrescriptions),
}));

export const exercisePrescriptionsRelations = relations(exercisePrescriptions, ({ one }) => ({
  treatmentPlan: one(treatmentPlans, {
    fields: [exercisePrescriptions.treatmentPlanId],
    references: [treatmentPlans.id],
  }),
}));

export const bodyMapEvolutionsRelations = relations(bodyMapEvolutions, ({ one, many }) => ({
  patient: one(patients, {
    fields: [bodyMapEvolutions.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [bodyMapEvolutions.appointmentId!],
    references: [appointments.id],
  }),
  soapNote: one(soapNotes, {
    fields: [bodyMapEvolutions.soapNoteId!],
    references: [soapNotes.id],
  }),
  regions: many(bodyMapRegions),
}));

export const bodyMapRegionsRelations = relations(bodyMapRegions, ({ one }) => ({
  evolution: one(bodyMapEvolutions, {
    fields: [bodyMapRegions.bodyMapEvolutionId],
    references: [bodyMapEvolutions.id],
  }),
}));

// Export types for TypeScript
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type SoapNote = typeof soapNotes.$inferSelect;
export type NewSoapNote = typeof soapNotes.$inferInsert;
export type TreatmentPlan = typeof treatmentPlans.$inferSelect;
export type NewTreatmentPlan = typeof treatmentPlans.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type NewFinancialTransaction = typeof financialTransactions.$inferInsert;
export type BodyMapEvolution = typeof bodyMapEvolutions.$inferSelect;
export type NewBodyMapEvolution = typeof bodyMapEvolutions.$inferInsert;
export type BodyMapRegion = typeof bodyMapRegions.$inferSelect;
export type NewBodyMapRegion = typeof bodyMapRegions.$inferInsert;
export type RegionHistory = typeof regionHistories.$inferSelect;
export type NewRegionHistory = typeof regionHistories.$inferInsert;
