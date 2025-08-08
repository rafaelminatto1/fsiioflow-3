

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AgendaPage from './pages/AgendaPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import EvaluationReportPage from './pages/EvaluationReportPage';
import SessionEvolutionPage from './pages/SessionEvolutionPage';
import HepGeneratorPage from './pages/HepGeneratorPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import { Role } from './types';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import GroupsPage from './pages/GroupsPage';
import InactivePatientEmailPage from './pages/InactivePatientEmailPage';
import ClinicalLibraryPage from './pages/ClinicalLibraryPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import SpecialtyAssessmentsPage from './pages/SpecialtyAssessmentsPage';
import EconomicPage from './pages/EconomicPage';
import ClinicalAnalyticsPage from './pages/ClinicalAnalyticsPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import SubscriptionPage from './pages/SubscriptionPage';
import LegalPage from './pages/LegalPage';
import AiSettingsPage from './pages/AiSettingsPage';
import KanbanPage from './pages/KanbanPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import AtendimentoPage from './pages/AtendimentoPage';
import AgendaSettingsPage from './pages/AgendaSettingsPage';
import MedicalReportPage from './pages/MedicalReportPage';
import MentoriaPage from './pages/MentoriaPage';
import WhatsAppPage from './pages/WhatsAppPage';
import TeleconsultaPage from './pages/TeleconsultaPage';

// Patient Portal Imports
import PatientPortalLayout from './layouts/PatientPortalLayout';
import PatientDashboardPage from './pages/patient-portal/PatientDashboardPage';
import PatientPainDiaryPage from './pages/patient-portal/PatientPainDiaryPage';
import PatientProgressPage from './pages/patient-portal/PatientProgressPage';
import VoucherStorePage from './pages/patient-portal/VoucherStorePage';
import MyVouchersPage from './pages/patient-portal/MyVouchersPage';
import GamificationPage from './pages/patient-portal/GamificationPage';
import MyAppointmentsPage from './pages/patient-portal/MyAppointmentsPage';
import DocumentsPage from './pages/patient-portal/DocumentsPage';
import MyExercisesPage from './pages/patient-portal/MyExercisesPage';


// Partner Portal Imports
import PartnerLayout from './layouts/PartnerLayout';
import EducatorDashboardPage from './pages/partner-portal/EducatorDashboardPage';
import ClientListPage from './pages/partner-portal/ClientListPage';
import ClientDetailPage from './pages/partner-portal/ClientDetailPage';
import PartnerExerciseLibraryPage from './pages/partner-portal/PartnerExerciseLibraryPage';
import FinancialsPage from './pages/partner-portal/FinancialsPage';


const AppRoutes: React.FC = () => {
    return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
           {/* Patient Portal Routes */}
           <Route 
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={[Role.Patient]}>
                <PatientPortalLayout>
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
                   <Routes>
                      <Route path="/" element={<Navigate to="/partner/dashboard" replace />} />
                      <Route path="/dashboard" element={<EducatorDashboardPage />} />
                      <Route path="/clients" element={<ClientListPage />} />
                      <Route path="/clients/:id" element={<ClientDetailPage />} />
                      <Route path="/exercises" element={<PartnerExerciseLibraryPage />} />
                      <Route path="/financials" element={<FinancialsPage />} />
                   </Routes>
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
                </MainLayout>
              </ProtectedRoute>
            } 
          />

        </Routes>
    );
};

export default AppRoutes;
