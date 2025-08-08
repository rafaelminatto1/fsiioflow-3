
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { Appointment, AppointmentStatus } from '../../../types';
import { Calendar, Clock } from 'lucide-react';

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const TodaysAppointments: React.FC = () => {
    const { enrichedAppointments } = useData();
    const navigate = useNavigate();

    const todaysAppointments = useMemo(() => {
        return enrichedAppointments
            .filter(app => isToday(app.startTime) && app.status === AppointmentStatus.Scheduled)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }, [enrichedAppointments]);

    const handleAppointmentClick = (appointment: Appointment) => {
        navigate(`/atendimento/${appointment.id}`);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col h-full max-h-96">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-sky-500" />
                Consultas de Hoje
            </h3>
            {todaysAppointments.length > 0 ? (
                <div className="space-y-3 overflow-y-auto flex-1 -mr-2 pr-2">
                    {todaysAppointments.map(app => (
                        <div key={app.id} onClick={() => handleAppointmentClick(app)} className="p-3 rounded-lg flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors">
                            <img src={app.patientAvatarUrl} alt={app.patientName} className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-900">{app.patientName}</p>
                                <p className="text-xs text-slate-500">{app.type}</p>
                            </div>
                            <div className="flex items-center text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                                {app.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                    <Calendar className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold">Nenhuma consulta hoje.</p>
                    <p className="text-xs">Um bom dia para organizar a clínica!</p>
                </div>
            )}
        </div>
    );
};

export default TodaysAppointments;
