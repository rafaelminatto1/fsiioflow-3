

<<<<<<< Current (Your changes)
import React from 'react';
=======
import React, { Suspense, lazy } from 'react';
>>>>>>> Incoming (Background Agent changes)
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';

// Lazily loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PatientListPage = lazy(() => import('./pages/PatientListPage'));
const PatientDetailPage = lazy(() => import('./pages/PatientDetailPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const EvaluationReportPage = lazy(() => import('./pages/EvaluationReportPage'));
const SessionEvolutionPage = lazy(() => import('./pages/SessionEvolutionPage'));
const HepGeneratorPage = lazy(() => import('./pages/HepGeneratorPage'));
const RiskAnalysisPage = lazy(() => import('./pages/RiskAnalysisPage'));
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const InactivePatientEmailPage = lazy(() => import('./pages/InactivePatientEmailPage'));
const ClinicalLibraryPage = lazy(() => import('./pages/ClinicalLibraryPage'));
const MaterialDetailPage = lazy(() => import('./pages/MaterialDetailPage'));
const SpecialtyAssessmentsPage = lazy(() => import('./pages/SpecialtyAssessmentsPage'));
const EconomicPage = lazy(() => import('./pages/EconomicPage'));
const ClinicalAnalyticsPage = lazy(() => import('./pages/ClinicalAnalyticsPage'));
const FinancialDashboardPage = lazy(() => import('./pages/FinancialDashboardPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AiSettingsPage = lazy(() => import('./pages/AiSettingsPage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenterPage'));
const AtendimentoPage = lazy(() => import('./pages/AtendimentoPage'));
const AgendaSettingsPage = lazy(() => import('./pages/AgendaSettingsPage'));
const MedicalReportPage = lazy(() => import('./pages/MedicalReportPage'));
const MentoriaPage = lazy(() => import('./pages/MentoriaPage'));
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage'));
const TeleconsultaPage = lazy(() => import('./pages/TeleconsultaPage'));

// Patient Portal Imports
import PatientPortalLayout from './layouts/PatientPortalLayout';
const PatientDashboardPage = lazy(() => import('./pages/patient-portal/PatientDashboardPage'));
const PatientPainDiaryPage = lazy(() => import('./pages/patient-portal/PatientPainDiaryPage'));
const PatientProgressPage = lazy(() => import('./pages/patient-portal/PatientProgressPage'));
const VoucherStorePage = lazy(() => import('./pages/patient-portal/VoucherStorePage'));
const MyVouchersPage = lazy(() => import('./pages/patient-portal/MyVouchersPage'));
const GamificationPage = lazy(() => import('./pages/patient-portal/GamificationPage'));
const MyAppointmentsPage = lazy(() => import('./pages/patient-portal/MyAppointmentsPage'));
const DocumentsPage = lazy(() => import('./pages/patient-portal/DocumentsPage'));
const MyExercisesPage = lazy(() => import('./pages/patient-portal/MyExercisesPage'));


// Partner Portal Imports
import PartnerLayout from './layouts/PartnerLayout';
const EducatorDashboardPage = lazy(() => import('./pages/partner-portal/EducatorDashboardPage'));
const ClientListPage = lazy(() => import('./pages/partner-portal/ClientListPage'));
const ClientDetailPage = lazy(() => import('./pages/partner-portal/ClientDetailPage'));
const PartnerExerciseLibraryPage = lazy(() => import('./pages/partner-portal/PartnerExerciseLibraryPage'));
const FinancialsPage = lazy(() => import('./pages/partner-portal/FinancialsPage'));


const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<div className="p-6 text-slate-500">Carregando...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
           {/* Patient Portal Routes */}
           <Route 
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={[Role.Patient]}>
                <PatientPortalLayout>
                   <Suspense fallback={<div className="p-6 text-slate-500">Carregando portal do paciente...</div>}>
                   <Routes>
                      <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
                      <Route path="/dashboard" element={<PatientDashboardPage />} />
                      <Route path="/meu-progresso" element={<PatientProgressPage />} />
                      <Route path="/my-exercises" element={<MyExercisesPage />} />
                      <Route path="/pain-diary" element={<PatientPainDiaryPage />} />
                      <Route path="/partner-services" element={<VoucherStorePage />} />
                      <Route path="/my-vouchers" element={<MyVouchersPage />} />
                      <Route path="/notifications" element={<NotificationCenterPage />} />
                      <Route path="/gamification" element={<GamificationPage />} />
                      <Route path="/appointments" element={<MyAppointmentsPage />} />
                      <Route path="/documents" element={<DocumentsPage />} />
                   </Routes>
                   </Suspense>
                </PatientPortalLayout>
              </ProtectedRoute>
            } 
          />

          {/* Partner Portal Routes */}
           <Route 
            path="/partner/*"
            element={
              <ProtectedRoute allowedRoles={[Role.EducadorFisico]}>
                <PartnerLayout>
                   <Suspense fallback={<div className="p-6 text-slate-500">Carregando portal do parceiro...</div>}>
                   <Routes>
                      <Route path="/" element={<Navigate to="/partner/dashboard" replace />} />
                      <Route path="/dashboard" element={<EducatorDashboardPage />} />
                      <Route path="/clients" element={<ClientListPage />} />
                      <Route path="/clients/:id" element={<ClientDetailPage />} />
                      <Route path="/exercises" element={<PartnerExerciseLibraryPage />} />
                      <Route path="/financials" element={<FinancialsPage />} />
                   </Routes>
                   </Suspense>
                </PartnerLayout>
              </ProtectedRoute>
            }
          />

          {/* Therapist Portal Routes (Catch-all) */}
          <Route 
            path="/*"
            element={
              <ProtectedRoute allowedRoles={[Role.Therapist, Role.Admin]}>
                <MainLayout>
                  <Suspense fallback={<div className="p-6 text-slate-500">Carregando...</div>}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/clinical-analytics" element={<ClinicalAnalyticsPage />} />
                    <Route path="/financials" element={<FinancialDashboardPage />} />
                    <Route path="/patients" element={<PatientListPage />} />
                    <Route path="/patients/:id" element={<PatientDetailPage />} />
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/notifications" element={<NotificationCenterPage />} />
                    <Route path="/whatsapp" element={<WhatsAppPage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/tasks" element={<KanbanPage />} />
                    <Route path="/avaliacoes" element={<SpecialtyAssessmentsPage />} />
                    <Route path="/exercises" element={<ExerciseLibraryPage />} />
                    <Route path="/materials" element={<ClinicalLibraryPage />} />
                    <Route path="/materials/:id" element={<MaterialDetailPage />} />
                    <Route path="/gerar-laudo" element={<EvaluationReportPage />} />
                    <Route path="/gerar-evolucao" element={<SessionEvolutionPage />} />
                    <Route path="/gerar-hep" element={<HepGeneratorPage />} />
                    <Route path="/analise-risco" element={<RiskAnalysisPage />} />
                    <Route path="/email-inativos" element={<InactivePatientEmailPage />} />
                    <Route path="/mentoria" element={<MentoriaPage />} />
                    <Route path="/medical-report/new/:patientId" element={<MedicalReportPage />} />
                    <Route path="/medical-report/edit/:reportId" element={<MedicalReportPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/audit-log" element={<AuditLogPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/legal" element={<LegalPage />} />
                    <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                    <Route path="/ia-economica" element={<EconomicPage />} />
                    <Route path="/ai-settings" element={<AiSettingsPage />} />
                    <Route path="/agenda-settings" element={<AgendaSettingsPage />} />
                    <Route path="/atendimento/:appointmentId" element={<AtendimentoPage />} />
                    <Route path="/teleconsulta/:appointmentId" element={<TeleconsultaPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

        </Routes>
        </Suspense>
    );
};

export default AppRoutes;
