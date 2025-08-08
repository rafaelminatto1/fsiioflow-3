
import React from 'react';
import { Appointment, Patient, Therapist } from '../types';
import PageHeader from '../components/PageHeader';
import KPICards from '../components/dashboard/KPICards';
import RevenueChart from '../components/dashboard/RevenueChart';
import PatientFlowChart from '../components/dashboard/PatientFlowChart';
import TeamProductivityChart from '../components/dashboard/TeamProductivityChart';
import AppointmentHeatmap from '../components/dashboard/AppointmentHeatmap';
import { Activity, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import TodaysAppointments from '../components/dashboard/glance/TodaysAppointments';
import PendingTasks from '../components/dashboard/glance/PendingTasks';
import RecentActivity from '../components/dashboard/glance/RecentActivity';

const DashboardPage: React.FC = () => {
    const { appointments, patients, therapists } = useData();

    return (
        <>
            <PageHeader
                title="Dashboard Administrativo"
                subtitle="Visão 360° do negócio com métricas financeiras, operacionais e clínicas."
            />

            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Resumo do Dia</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TodaysAppointments />
                    <PendingTasks />
                    <RecentActivity />
                </div>
            </div>

            <KPICards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <RevenueChart appointments={appointments} />
                <PatientFlowChart patients={patients} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-teal-500" /> Mapa de Calor de Agendamentos
                    </h3>
                    <AppointmentHeatmap appointments={appointments} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-teal-500" /> Produtividade da Equipe
                    </h3>
                    <TeamProductivityChart appointments={appointments} therapists={therapists} />
                </div>
            </div>
        </>
    );
};

export default DashboardPage;