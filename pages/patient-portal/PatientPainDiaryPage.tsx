
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import PainScale from '../../components/PainScale';
import PainTrendChart from '../../components/patient-portal/PainTrendChart';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import * as painLogService from '../../services/painLogService';
import { PainLog } from '../../types';
import { Save, Loader } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';

const PainDiaryPage: React.FC = () => {
    const [painLogs, setPainLogs] = useState<PainLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [currentPainLevel, setCurrentPainLevel] = useState<number | undefined>(undefined);
    const [currentNotes, setCurrentNotes] = useState('');
    
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user?.patientId) return;
            setIsLoading(true);
            try {
                const logs = await painLogService.getLogsByPatientId(user.patientId);
                setPainLogs(logs);
            } catch (error) {
                showToast('Falha ao carregar o diário de dor.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, [user, showToast]);

    const handleSaveLog = async () => {
        if (currentPainLevel === undefined || !user?.patientId) {
            showToast('Por favor, selecione um nível de dor antes de salvar.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const newLog = await painLogService.addLog({
                patientId: user.patientId,
                date: new Date(),
                painLevel: currentPainLevel,
                notes: currentNotes,
            });
            setPainLogs(prev => [newLog, ...prev]);
            setCurrentPainLevel(undefined);
            setCurrentNotes('');
            showToast('Registro de dor salvo com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao salvar o registro.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderLogHistory = () => {
        if (isLoading) {
            return <Skeleton className="h-48 w-full rounded-lg" />;
        }
        if (painLogs.length === 0) {
            return <p className="text-center text-slate-500 py-8">Nenhum registro encontrado. Adicione seu primeiro registro acima.</p>;
        }
        return (
            <ul className="space-y-4">
                {painLogs.map(log => (
                    <li key={log.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-slate-700">{log.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                            <span className="font-bold text-teal-600 text-lg">Nível: {log.painLevel}</span>
                        </div>
                        {log.notes && <p className="text-sm text-slate-600 mt-2 pl-2 border-l-2 border-slate-200">{log.notes}</p>}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <>
            <PageHeader
                title="Diário de Dor"
                subtitle="Registre seu nível de dor diariamente para ajudar no seu tratamento."
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Como você está se sentindo hoje?</h3>
                        <div className="space-y-4">
                            <PainScale selectedScore={currentPainLevel} onSelectScore={setCurrentPainLevel} />
                            <div>
                                <label className="text-sm font-medium text-slate-700">Anotações (opcional)</label>
                                <textarea 
                                    value={currentNotes}
                                    onChange={(e) => setCurrentNotes(e.target.value)}
                                    rows={3} 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg"
                                    placeholder="Ex: A dor foi mais forte pela manhã, melhorou após o alongamento..."
                                />
                            </div>
                            <div className="text-right">
                                <button 
                                    onClick={handleSaveLog}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 disabled:bg-teal-300"
                                >
                                    {isSaving ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    {isSaving ? 'Salvando...' : 'Salvar Registro de Hoje'}
                                </button>
                            </div>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Seu Histórico</h3>
                        {renderLogHistory()}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolução da Dor</h3>
                        {isLoading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : painLogs.length > 0 ? (
                           <PainTrendChart painLogs={painLogs} />
                        ) : (
                           <p className="text-center text-sm text-slate-500 py-8">O gráfico aparecerá aqui quando você tiver registros.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PainDiaryPage;