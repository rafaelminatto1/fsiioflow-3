

import React, { useState } from 'react';
import { DollarSign, Users, Activity, UserCheck, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import FinancialReport from '../components/reports/FinancialReport';
import PatientReport from '../components/reports/PatientReport';
import PlaceholderReport from '../components/reports/PlaceholderReport';
import { useData } from '../contexts/DataContext';

type Tab = 'financeiro' | 'pacientes' | 'clinico' | 'equipe' | 'lgpd';

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('financeiro');
    const { appointments, patients, therapists, isLoading, error } = useData();
    
    const tabs: { id: Tab; name: string; icon: React.ElementType }[] = [
        { id: 'financeiro', name: 'Financeiro', icon: DollarSign },
        { id: 'pacientes', name: 'Pacientes', icon: Users },
        { id: 'clinico', name: 'Clínico', icon: Activity },
        { id: 'equipe', name: 'Equipe', icon: UserCheck },
        { id: 'lgpd', name: 'LGPD', icon: ShieldCheck },
    ];
    
    const renderContent = () => {
        if (isLoading) return <PageLoader />;
        if (error) return <div className="text-center p-10 text-red-500">Falha ao carregar dados para os relatórios.</div>;
        
        switch (activeTab) {
            case 'financeiro':
                return <FinancialReport appointments={appointments} therapists={therapists} />;
            case 'pacientes':
                return <PatientReport patients={patients} />;
            case 'clinico':
                return <PlaceholderReport title="Relatórios Clínicos" />;
            case 'equipe':
                return <PlaceholderReport title="Relatórios de Equipe" />;
            case 'lgpd':
                 return <PlaceholderReport title="Relatórios de Conformidade LGPD" />;
            default:
                return null;
        }
    };

    return (
        <>
            <PageHeader
                title="Central de Relatórios"
                subtitle="Transforme dados em decisões. Insights para otimizar sua clínica."
            />
            
            <div className="mb-6">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                                    ${activeTab === tab.id
                                        ? 'border-sky-500 text-sky-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }
                                `}
                            >
                                <tab.icon className="mr-2 h-5 w-5" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div>
                {renderContent()}
            </div>
        </>
    );
};

export default ReportsPage;
