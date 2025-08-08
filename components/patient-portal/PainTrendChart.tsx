import React, { useEffect, useState, useMemo } from 'react';
import { PainLog } from '../../types';

interface PainTrendChartProps {
    painLogs: PainLog[];
}

const PainTrendChart: React.FC<PainTrendChartProps> = ({ painLogs }) => {
    const [Recharts, setRecharts] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        import('recharts').then(mod => {
            if (mounted) setRecharts(mod);
        });
        return () => { mounted = false; };
    }, []);

    const chartData = useMemo(() => painLogs
        .map(log => ({
            name: log.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            'Nível de Dor': log.painLevel,
            notes: log.notes
        }))
        .reverse(), [painLogs]);

    if (!Recharts) {
        return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Carregando gráfico...</div>;
    }

    const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Recharts;

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="#64748b" fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                        labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Line type="monotone" dataKey="Nível de Dor" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PainTrendChart;