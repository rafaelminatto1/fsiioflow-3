// hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { AppointmentStatus } from '../types';

interface DashboardStats {
    monthlyRevenue: { value: string; change?: string; changeType?: 'increase' | 'decrease' };
    activePatients: { value: string; subtitle: string; };
    newPatientsThisMonth: { value: string; change?: string; changeType?: 'increase' | 'decrease' };
    avgSatisfaction: { value: string; subtitle: string; };
}

// Helper to calculate percentage change
const calculateChange = (current: number, previous: number): { change?: string; changeType?: 'increase' | 'decrease' } => {
    if (previous === 0) {
        return current > 0 ? { change: '+∞%', changeType: 'increase' } : {};
    }
    const percentageChange = ((current - previous) / previous) * 100;
    if (Math.abs(percentageChange) < 0.1) return {};
    
    return {
        change: `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%`,
        changeType: percentageChange >= 0 ? 'increase' : 'decrease',
    };
};

export default function useDashboardStats() {
    const { patients, appointments, isLoading: isDataLoading } = useData();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isDataLoading) {
            setIsLoading(true);
            return;
        }

        // --- Date setup ---
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // --- Calculations for THIS month ---
        const newPatientsThisMonthCount = patients.filter(p => new Date(p.registrationDate) >= startOfThisMonth).length;
        const revenueThisMonth = appointments
            .filter(app => app.status === AppointmentStatus.Completed && new Date(app.startTime) >= startOfThisMonth)
            .reduce((sum, app) => sum + app.value, 0);

        // --- Calculations for LAST month ---
        const newPatientsLastMonthCount = patients.filter(p => {
            const regDate = new Date(p.registrationDate);
            return regDate >= startOfLastMonth && regDate <= endOfLastMonth;
        }).length;
        const revenueLastMonth = appointments
            .filter(app => {
                const appDate = new Date(app.startTime);
                return app.status === AppointmentStatus.Completed && appDate >= startOfLastMonth && appDate <= endOfLastMonth;
            })
            .reduce((sum, app) => sum + app.value, 0);

        // --- Other stats ---
        const activePatientsCount = patients.filter(p => p.status === 'Active').length;

        // --- Formatting and Change Calculation ---
        const revenueChange = calculateChange(revenueThisMonth, revenueLastMonth);
        const newPatientsChange = calculateChange(newPatientsThisMonthCount, newPatientsLastMonthCount);

        setStats({
            monthlyRevenue: {
                value: `R$ ${revenueThisMonth.toLocaleString('pt-BR')}`,
                ...revenueChange
            },
            activePatients: {
                value: activePatientsCount.toString(),
                subtitle: 'Total em tratamento'
            },
            newPatientsThisMonth: {
                value: newPatientsThisMonthCount.toString(),
                ...newPatientsChange
            },
            avgSatisfaction: { // Still mocked
                value: '9.2/10',
                subtitle: 'Baseado em 48 avaliações'
            }
        });
        
        setIsLoading(false);

    }, [patients, appointments, isDataLoading]);

    return { stats, isLoading, error: null };
}