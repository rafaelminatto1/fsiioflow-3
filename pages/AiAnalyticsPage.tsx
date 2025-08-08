
import React, { useState, useEffect } from 'react';
import { AreaChart, BrainCircuit, HardDrive, Library, Sparkles } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { aiOrchestratorService } from '../services/ai/aiOrchestratorService';
import { AIQueryLog, StatCardData, AIProvider } from '../types';

const AnalyticsStatCard: React.FC<StatCardData> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className="bg-teal-100 text-teal-600 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
);

const QueryLogRow: React.FC<{ log: AIQueryLog }> = ({ log }) => {
    const sourceInfo = {
        [AIProvider.CACHE]: { icon: HardDrive, color: 'bg-sky-100 text-sky-800' },
        [AIProvider.INTERNAL_KB]: { icon: Library, color: 'bg-purple-100 text-purple-800' },
        [AIProvider.GEMINI]: { icon: Sparkles, color: 'bg-green-100 text-green-800' },
        [AIProvider.CHATGPT]: { icon: Sparkles, color: 'bg-green-100 text-green-800' },
        [AIProvider.CLAUDE]: { icon: Sparkles, color: 'bg-green-100 text-green-800' },
        [AIProvider.PERPLEXITY]: { icon: Sparkles, color: 'bg-green-100 text-green-800' },
        [AIProvider.MARS]: { icon: Sparkles, color: 'bg-green-100 text-green-800' },
    };

    const info = sourceInfo[log.source] || { icon: BrainCircuit, color: 'bg-slate-100 text-slate-800' };
    const Icon = info.icon;

    return (
        <tr className="border-b border-slate-200">
            <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={log.prompt}>{log.prompt}</td>
            <td className="p-4 text-sm text-slate-600 max-w-md truncate" title={log.content}>{log.content}</td>
            <td className="p-4 whitespace-nowrap">
                <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${info.color}`}>
                   <Icon className="w-3.5 h-3.5 mr-1.5" />
                   {log.source}
                </span>
            </td>
            <td className="p-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                {log.timestamp.toLocaleTimeString('pt-BR')}
            </td>
        </tr>
    );
};


const AiAnalyticsPage: React.FC = () => {
    const [stats, setStats] = useState(aiOrchestratorService.getStats());
    const [logs, setLogs] = useState<AIQueryLog[]>(aiOrchestratorService.getLogs());

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(aiOrchestratorService.getStats());
            setLogs([...aiOrchestratorService.getLogs()]);
        }, 2000); // Refresh stats and logs every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const statCards: StatCardData[] = [
        { title: 'Total de Consultas', value: stats.totalQueries.toString(), icon: <BrainCircuit /> },
        { title: 'Acertos no Cache', value: stats.cacheHits.toString(), icon: <HardDrive /> },
        { title: 'Respostas da Base Interna', value: stats.knowledgeBaseHits.toString(), icon: <Library /> },
        { title: 'Chamadas à API Externa', value: stats.apiHits.toString(), icon: <Sparkles /> },
    ];

    return (
        <>
            <PageHeader
                title="AI Analytics"
                subtitle="Monitore a eficiência e o uso do seu Orquestrador de IA em tempo real."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(stat => <AnalyticsStatCard key={stat.title} {...stat} />)}
            </div>

             <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4">Log de Consultas Recentes</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prompt</th>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resposta (Prévia)</th>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fonte</th>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Horário</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {logs.map((log) => (
                                <QueryLogRow key={log.id} log={log} />
                            ))}
                        </tbody>
                    </table>
                     {logs.length === 0 && (
                        <div className="text-center p-10">
                            <AreaChart className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhuma consulta registrada</h3>
                            <p className="mt-1 text-sm text-slate-500">Use o Assistente de IA para ver os logs aparecerem aqui.</p>
                        </div>
                    )}
                </div>
            </div>

        </>
    );
};

export default AiAnalyticsPage;
