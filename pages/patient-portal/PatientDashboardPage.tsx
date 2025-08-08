

import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import * as treatmentService from '../../services/treatmentService';
import { TreatmentPlan } from '../../types';
import { Target, Flame, Award } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { useGamification } from '../../hooks/useGamification';

const GoalTracker: React.FC = () => {
    const { user } = useAuth();
    const [plan, setPlan] = useState<TreatmentPlan | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            if (user?.patientId) {
                setIsLoading(true);
                const fetchedPlan = await treatmentService.getPlanByPatientId(user.patientId);
                setPlan(fetchedPlan);
                setIsLoading(false);
            }
        };
        fetchPlan();
    }, [user]);

    if (isLoading) {
        return (
             <div className="bg-white p-6 rounded-2xl shadow-sm">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                 <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-teal-500" />
                    Objetivos do Tratamento
                </h3>
                <p className="text-slate-500">Nenhum plano de tratamento ativo encontrado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
             <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-teal-500" />
                Objetivos do Tratamento
            </h3>
            <p className="text-slate-600">{plan.treatmentGoals}</p>
        </div>
    );
};

const GamificationSummaryCard: React.FC = () => {
    const { user } = useAuth();
    const { progress, isLoading } = useGamification(user?.patientId);

    if (isLoading || !progress) {
        return <Skeleton className="h-40 w-full rounded-2xl" />;
    }
    
    const { level, points, streak, achievements } = progress;
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Seu Engajamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-3xl font-bold text-teal-500">{level}</p>
                    <p className="text-sm text-slate-500">Nível</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-teal-500">{points}</p>
                    <p className="text-sm text-slate-500">Pontos (XP)</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center text-3xl font-bold text-amber-500">
                        <Flame className="w-7 h-7 mr-1" /> {streak}
                    </div>
                    <p className="text-sm text-slate-500">Dias em sequência</p>
                </div>
                <div className="sm:col-span-3 mt-2 flex items-center justify-center text-sm text-slate-600">
                    <Award className="w-5 h-5 mr-2 text-slate-400" />
                    <span>{unlockedCount} de {achievements.length} conquistas desbloqueadas.</span>
                </div>
            </div>
        </div>
    );
};

const PatientDashboardPage: React.FC = () => {
    const { user } = useAuth();

    return (
         <>
            <PageHeader
                title={`Bem-vindo(a), ${user?.name.split(' ')[0]}!`}
                subtitle="Acompanhe seu progresso e mantenha-se em dia com seu tratamento."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GoalTracker />
                <GamificationSummaryCard />
            </div>
             <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4">Próximos Passos</h3>
                 <p className="text-slate-600">Explore o seu Diário de Dor para registrar como você está se sentindo. Em breve, você poderá ver seus exercícios e próximas consultas aqui.</p>
             </div>
        </>
    );
};

export default PatientDashboardPage;