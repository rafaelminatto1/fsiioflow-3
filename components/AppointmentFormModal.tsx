import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, AlertTriangle, Calendar, Clock, User, ClipboardList, Tag, Repeat, FileText, MessageSquarePlus, Loader, Clipboard, Check, MessageSquare, Hash, Lightbulb, DollarSign } from 'lucide-react';
import { Appointment, Patient, AppointmentStatus, AppointmentType, Therapist, RecurrenceRule } from '../types';
import RecurrenceSelector from './RecurrenceSelector';
import { useToast } from '../contexts/ToastContext';
import { generateAppointmentReminder, AppointmentReminderData } from '../services/geminiService';
import { validateAppointment, ValidationResult } from '../services/schedulingRulesEngine';


interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<boolean>;
  onDelete: (id: string, seriesId?: string) => Promise<boolean>;
  appointmentToEdit?: Appointment;
  initialData?: { date: Date, therapistId?: string };
  patients: Patient[];
  therapists: Therapist[];
  allAppointments: Appointment[];
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ isOpen, onClose, onSave, onDelete, appointmentToEdit, initialData, patients, therapists, allAppointments }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    observations: '',
    value: 180,
    paymentStatus: 'pending' as 'paid' | 'pending',
    sessionNumber: '',
    totalSessions: '',
  });
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSeries, setDeleteSeries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [isGeneratingReminder, setIsGeneratingReminder] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ warnings: [], suggestions: [] });
  const [isPriceOverridden, setIsPriceOverridden] = useState(false);
  const [isEndTimeManuallySet, setIsEndTimeManuallySet] = useState(false);

  const { showToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const formatTime = (date: Date) => date.toTimeString().slice(0, 5);
    const formatDate = (date: Date) => date.toISOString().slice(0, 10);

    if (appointmentToEdit) {
      setFormData({
        patientId: appointmentToEdit.patientId,
        therapistId: appointmentToEdit.therapistId,
        title: appointmentToEdit.title,
        date: formatDate(appointmentToEdit.startTime),
        startTime: formatTime(appointmentToEdit.startTime),
        endTime: formatTime(appointmentToEdit.endTime),
        type: appointmentToEdit.type,
        status: appointmentToEdit.status,
        observations: appointmentToEdit.observations || '',
        value: appointmentToEdit.value,
        paymentStatus: appointmentToEdit.paymentStatus,
        sessionNumber: appointmentToEdit.sessionNumber?.toString() || '',
        totalSessions: appointmentToEdit.totalSessions?.toString() || '',
      });
      setRecurrenceRule(appointmentToEdit.recurrenceRule);
      setIsPriceOverridden(true); // Assume existing appointments have set prices
      setIsEndTimeManuallySet(true); // For existing appointments, assume manual time
    } else {
        const startDate = initialData?.date || new Date();
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        setFormData({
            patientId: '',
            therapistId: initialData?.therapistId || therapists[0]?.id || '',
            title: '',
            date: formatDate(startDate),
            startTime: formatTime(startDate),
            endTime: formatTime(endDate),
            type: AppointmentType.Session,
            status: AppointmentStatus.Scheduled,
            observations: '',
            value: 180,
            paymentStatus: 'pending',
            sessionNumber: '',
            totalSessions: '',
        });
        setRecurrenceRule(undefined);
        setIsPriceOverridden(false);
        setIsEndTimeManuallySet(false); // For new ones, allow auto-update
    }
    setError(null);
    setShowDeleteConfirm(false);
    setReminderText('');
    setReminderCopied(false);
    setValidationResult({ warnings: [], suggestions: [] });
  }, [appointmentToEdit, initialData, isOpen, therapists]);

  // useEffect for automatic pricing
  useEffect(() => {
    if (isPriceOverridden) return;

    let newValue = 180; // Default for 'Sessão'
    if (formData.type === AppointmentType.Evaluation) {
        newValue = 0;
    } else if (formData.type === AppointmentType.Session) {
        if (formData.totalSessions === '10') {
            newValue = 170;
        } else {
            newValue = 180;
        }
    } else if (formData.type === AppointmentType.Return) {
        newValue = 100;
    }
    
    setFormData(prev => ({...prev, value: newValue}));
  }, [formData.type, formData.totalSessions, isPriceOverridden]);
  
   // useEffect for real-time validation
  useEffect(() => {
    if (!isOpen) return;

    const runValidation = async () => {
        if (!formData.patientId || !formData.date) {
            setValidationResult({ warnings: [], suggestions: [] });
            return;
        }

        const patientAppointments = allAppointments.filter(app => app.patientId === formData.patientId && app.id !== appointmentToEdit?.id);
        
        const newAppointmentData = {
            patientId: formData.patientId,
            therapistId: formData.therapistId,
            title: formData.title,
            startTime: new Date(`${formData.date}T${formData.startTime || '00:00'}`),
            endTime: new Date(`${formData.date}T${formData.endTime || '00:00'}`),
            status: formData.status,
            type: formData.type,
            observations: formData.observations,
            value: Number(formData.value),
            paymentStatus: formData.paymentStatus,
            patientAvatarUrl: patients.find(p => p.id === formData.patientId)?.avatarUrl || '',
            sessionNumber: formData.sessionNumber ? parseInt(formData.sessionNumber, 10) : undefined,
            totalSessions: formData.totalSessions ? parseInt(formData.totalSessions, 10) : undefined,
        };

        const result = await validateAppointment(newAppointmentData, patientAppointments);
        setValidationResult(result);
    };

    const debounceTimer = setTimeout(() => {
        runValidation();
    }, 500); // Debounce to avoid running on every keystroke

    return () => clearTimeout(debounceTimer);

  }, [formData.patientId, formData.date, formData.sessionNumber, formData.totalSessions, allAppointments, appointmentToEdit, isOpen, formData.type, formData.therapistId, formData.title, formData.startTime, formData.endTime, formData.status, formData.observations, formData.value, formData.paymentStatus, patients]);

  // useEffect for automatic 1-hour duration
  useEffect(() => {
    if (isEndTimeManuallySet || !formData.date || !formData.startTime) return;

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    if (!isNaN(startDateTime.getTime())) {
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
        const newEndTime = endDateTime.toTimeString().slice(0, 5);
        
        if (newEndTime !== formData.endTime) {
            setFormData(prev => ({ ...prev, endTime: newEndTime }));
        }
    }
  }, [formData.date, formData.startTime, isEndTimeManuallySet, formData.endTime]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusableElements) return;
            
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, [name]: value}));
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsPriceOverridden(true);
      handleChange(e);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEndTimeManuallySet(true);
    handleChange(e);
  };

  const handleSaveClick = async () => {
    if (!formData.patientId || !formData.therapistId || !formData.date || !formData.startTime || !formData.endTime) {
      setError("Paciente, Terapeuta, Data e Horários são obrigatórios.");
      return;
    }
    setError(null);
    setIsSaving(true);
    
    const patientName = patients.find(p => p.id === formData.patientId)?.name || 'Desconhecido';
    
    const appointmentData: Appointment = {
        id: appointmentToEdit?.id || `app_${Date.now()}`,
        patientId: formData.patientId,
        patientName,
        patientAvatarUrl: patients.find(p => p.id === formData.patientId)?.avatarUrl || '',
        therapistId: formData.therapistId,
        title: formData.title,
        startTime: new Date(`${formData.date}T${formData.startTime}`),
        endTime: new Date(`${formData.date}T${formData.endTime}`),
        status: formData.status,
        type: formData.type,
        observations: formData.observations,
        value: Number(formData.value),
        paymentStatus: formData.paymentStatus,
        recurrenceRule: recurrenceRule,
        seriesId: appointmentToEdit?.seriesId,
        sessionNumber: formData.sessionNumber ? parseInt(formData.sessionNumber, 10) : undefined,
        totalSessions: formData.totalSessions ? parseInt(formData.totalSessions, 10) : undefined,
    };

    const success = await onSave(appointmentData);
    
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };
  
  const handleDeleteClick = async () => {
      if(appointmentToEdit) {
          const success = await onDelete(appointmentToEdit.id, deleteSeries ? appointmentToEdit.seriesId : undefined);
          if (success) {
            onClose();
          }
      }
  }

  const handleGenerateReminder = async () => {
      if (!appointmentToEdit) return;
      setIsGeneratingReminder(true);
      setReminderText('');
      setReminderCopied(false);

      const therapistName = therapists.find(t => t.id === appointmentToEdit.therapistId)?.name || '';
      const patientName = patients.find(p => p.id === appointmentToEdit.patientId)?.name || '';

      const reminderData: AppointmentReminderData = {
          nome_paciente: patientName,
          data_consulta: appointmentToEdit.startTime,
          hora_consulta: appointmentToEdit.startTime.toTimeString().slice(0, 5),
          nome_fisio: therapistName,
      };

      try {
          const result = await generateAppointmentReminder(reminderData);
          setReminderText(result);
          showToast('Lembrete gerado com sucesso!', 'success');
      } catch (e: any) {
          showToast(e.message || 'Falha ao gerar lembrete.', 'error');
      } finally {
          setIsGeneratingReminder(false);
      }
  };

  const handleCopyReminder = () => {
      if (!reminderText) return;
      navigator.clipboard.writeText(reminderText);
      setReminderCopied(true);
      showToast('Lembrete copiado!', 'success');
      setTimeout(() => setReminderCopied(false), 2000);
  };

  if (!isOpen) return null;
  const title = appointmentToEdit ? 'Editar Consulta' : 'Nova Consulta';
  const patientPhone = patients.find(p => p.id === formData.patientId)?.phone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
            {(validationResult.warnings.length > 0 || validationResult.suggestions.length > 0) && (
                <div className="space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                        <div key={`warn-${index}`} className="p-3 bg-amber-50 text-amber-800 border-l-4 border-amber-400 rounded-r-lg text-sm flex items-start">
                            <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
                            <span>{warning}</span>
                        </div>
                    ))}
                    {validationResult.suggestions.map((suggestion, index) => (
                        <div key={`sugg-${index}`} className="p-3 bg-sky-50 text-sky-800 border-l-4 border-sky-400 rounded-r-lg text-sm flex items-start">
                            <Lightbulb className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
                            <span>{suggestion}</span>
                        </div>
                    ))}
                </div>
            )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><User className="w-4 h-4 mr-2 text-slate-400"/> Paciente</label>
                    <select name="patientId" value={formData.patientId} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="">Selecione um paciente</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><ClipboardList className="w-4 h-4 mr-2 text-slate-400"/> Fisioterapeuta</label>
                    <select name="therapistId" value={formData.therapistId} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                        {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
             </div>
             <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Tag className="w-4 h-4 mr-2 text-slate-400"/> Tipo / Título da Consulta</label>
                <div className="flex">
                    <select name="type" value={formData.type} onChange={handleChange} className="p-2 border border-slate-300 rounded-l-lg bg-white border-r-0">
                         {Object.values(AppointmentType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Fortalecimento de Quadríceps" className="w-full p-2 border border-slate-300 rounded-r-lg"/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Calendar className="w-4 h-4 mr-2 text-slate-400"/> Data</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg" disabled={!!appointmentToEdit?.seriesId} />
                </div>
                 <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Clock className="w-4 h-4 mr-2 text-slate-400"/> Início</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg" step="900" />
                </div>
                 <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Clock className="w-4 h-4 mr-2 text-slate-400"/> Fim</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleEndTimeChange} className="w-full p-2 border border-slate-300 rounded-lg" step="900" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Hash className="w-4 h-4 mr-2 text-slate-400"/> Pacote de Sessões</label>
                    <div className="flex items-center gap-2">
                        <input type="number" name="sessionNumber" value={formData.sessionNumber} onChange={handleChange} placeholder="Nº da Sessão" className="w-full p-2 border border-slate-300 rounded-lg" />
                        <span className="text-slate-500">de</span>
                        <input type="number" name="totalSessions" value={formData.totalSessions} onChange={handleChange} placeholder="Total (Ex: 10)" className="w-full p-2 border border-slate-300 rounded-lg" />
                    </div>
                </div>
                 <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><DollarSign className="w-4 h-4 mr-2 text-slate-400"/> Valor (R$)</label>
                    <input type="number" name="value" value={formData.value} onChange={handleValueChange} className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
            </div>
            <div>
                 <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><FileText className="w-4 h-4 mr-2 text-slate-400"/> Observações</label>
                 <textarea name="observations" value={formData.observations} onChange={handleChange} rows={2} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Adicione notas ou detalhes importantes..."></textarea>
            </div>
            {!appointmentToEdit?.seriesId && <RecurrenceSelector recurrenceRule={recurrenceRule} onChange={setRecurrenceRule} />}
            
            {appointmentToEdit && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                    <button 
                        onClick={handleGenerateReminder} 
                        disabled={isGeneratingReminder}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 transition-colors"
                    >
                        {isGeneratingReminder ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <MessageSquarePlus className="w-5 h-5 mr-2" />}
                        {isGeneratingReminder ? 'Gerando...' : 'Gerar Lembrete Inteligente'}
                    </button>

                    {reminderText && (
                        <div className="p-3 bg-white rounded-md border border-slate-200 animate-fade-in-fast">
                            <p className="text-sm whitespace-pre-wrap text-slate-700">{reminderText}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <button onClick={handleCopyReminder} className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                                    {reminderCopied ? <Check className="w-3 h-3 text-green-500"/> : <Clipboard className="w-3 h-3"/>}
                                    {reminderCopied ? 'Copiado!' : 'Copiar'}
                                </button>
                                <a href={`https://wa.me/${patientPhone}?text=${encodeURIComponent(reminderText)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1.5 border border-transparent rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors">
                                    <MessageSquare className="w-3 h-3"/> Enviar via WhatsApp
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> {error}</div>}
            
            {showDeleteConfirm && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                    <div className="flex">
                        <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-500"/></div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-800">Confirmar Exclusão</h3>
                            <p className="text-sm text-red-700 mt-1">Tem certeza de que deseja excluir esta consulta?</p>
                            {appointmentToEdit?.seriesId && (
                                <div className="mt-2 space-y-2">
                                    <label className="flex items-center text-sm"><input type="radio" name="delete_option" checked={!deleteSeries} onChange={() => setDeleteSeries(false)} className="mr-2"/> Excluir apenas esta ocorrência</label>

                                    <label className="flex items-center text-sm"><input type="radio" name="delete_option" checked={deleteSeries} onChange={() => setDeleteSeries(true)} className="mr-2"/> Excluir esta e todas as futuras</label>
                                </div>
                            )}
                            <div className="mt-4">
                                <button onClick={handleDeleteClick} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">Sim, excluir</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="ml-3 inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
        
        <footer className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
           {appointmentToEdit && !showDeleteConfirm && (
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center">
                    <Trash2 className="w-4 h-4 mr-2"/> Excluir
                </button>
           )}
           <div className="ml-auto">
             <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
             <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-lg hover:bg-sky-600 flex items-center disabled:bg-sky-300">
               <Save className="w-4 h-4 mr-2" />
               {isSaving ? 'Salvando...' : 'Salvar'}
             </button>
           </div>
        </footer>
        <style>{`
            @keyframes fade-in-fast {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default AppointmentFormModal;
