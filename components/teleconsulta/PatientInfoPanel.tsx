// components/teleconsulta/PatientInfoPanel.tsx
import React, { useState, useEffect } from 'react';
import { Patient, SoapNote, TreatmentPlan } from '../../types';
import * as soapNoteService from '../../services/soapNoteService';
import * as treatmentService from '../../services/treatmentService';
import { Target, FileText, UserCircle } from 'lucide-react';

interface PatientInfoPanelProps {
    patient: Patient;
}

const PatientInfoPanel: React.FC<PatientInfoPanelProps> = ({ patient }) => {
    const [lastNote, setLastNote] = useState<SoapNote | null>(null);
    const [plan, setPlan] = useState<TreatmentPlan | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            const [notes, planData] = await Promise.all([
                soapNoteService.getNotesByPatientId(patient.id),
                treatmentService.getPlanByPatientId(patient.id)
            ]);
            setLastNote(notes[0] || null);
            setPlan(planData || null);
        };
        fetchData();
    }, [patient.id]);

    return (
        <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-700/50 rounded-lg">
                <h3 className="font-bold text-lg flex items-center mb-2">
                    <UserCircle className="w-5 h-5 mr-2 text-teal-400" />
                    Paciente
                </h3>
                <p><strong>Queixa:</strong> {patient.conditions?.[0]?.name || 'N/A'}</p>
                 <p><strong>Alertas:</strong> {patient.medicalAlerts || 'Nenhum'}</p>
            </div>
            
             {plan && (
                <div className="p-3 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold flex items-center mb-2">
                        <Target className="w-5 h-5 mr-2 text-teal-400" />
                        Objetivos
                    </h3>
                    <p className="text-xs">{plan.treatmentGoals}</p>
                </div>
            )}

            {lastNote && (
                 <div className="p-3 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold flex items-center mb-2">
                        <FileText className="w-5 h-5 mr-2 text-teal-400" />
                        Última Sessão ({lastNote.date})
                    </h3>
                    <div className="space-y-1 text-xs">
                        <p><strong>S:</strong> {lastNote.subjective}</p>
                        <p><strong>A:</strong> {lastNote.assessment}</p>
                        <p><strong>P:</strong> {lastNote.plan}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientInfoPanel;
