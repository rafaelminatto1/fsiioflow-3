import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Cake, Phone, Mail, ChevronLeft, Edit, FileText, Plus, Target, ListChecks, ShieldCheck, Paperclip, Upload, BarChart, Heart, X, Download, Send, Layers, CalendarDays, BookOpen } from 'lucide-react';
import * as patientService from '../services/patientService';
import * as soapNoteService from '../services/soapNoteService';
import * as treatmentService from '../services/treatmentService';
import * as reportService from '../services/reportService';
import PageHeader from '../components/PageHeader';
import NewSoapNoteModal from '../components/NewSoapNoteModal';
import PatientFormModal from '../components/PatientFormModal';
import { SoapNote, Appointment, TreatmentPlan, Patient, TrackedMetric, Condition, MedicalReport } from '../types';
import AppointmentFormModal from '../components/AppointmentFormModal';
import PageLoader from '../components/ui/PageLoader';
import InfoCard from '../components/ui/InfoCard';
import { useToast } from '../contexts/ToastContext';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import MetricTrackerCard from '../components/MetricTrackerCard';
import MetricEvolutionChart from '../components/MetricEvolutionChart';
import ClinicalHistoryTimeline from '../components/ClinicalHistoryTimeline';
import AppointmentTimeline from '../components/AppointmentTimeline';
import { useData } from '../contexts/DataContext';
import { useAppointments } from '../hooks/useAppointments';

const InfoPill: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="text-sm font-semibold text-slate-800">{value}</div>
        </div>
    </div>
);

const calculateTimeSince = (dateString: string) => {
    const surgeryDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - surgeryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    return { days: diffDays, weeks: diffWeeks };
};

const TreatmentPlanCard: React.FC<{ plan: TreatmentPlan }> = ({ plan }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="border-b border-slate-200 pb-4 mb-4">
            <h4 className="font-bold text-lg text-slate-800">Plano de Tratamento</h4>
            <p className="text-sm text-slate-500">Diagnóstico COFFITO: {plan.coffitoDiagnosisCodes}</p>
        </div>
        <div className="space-y-4 text-sm">
            <div>
                <h5 className="font-semibold text-sky-600 flex items-center mb-2"><Target className="w-4 h-4 mr-2" /> Objetivos Principais</h5>
                <p className="text-slate-600 pl-6">{plan.treatmentGoals}</p>
            </div>
             <div>
                <h5 className="font-semibold text-sky-600 flex items-center mb-2"><ListChecks className="w-4 h-4 mr-2" /> Exercícios Prescritos</h5>
                <div className="flex flex-wrap gap-2 pl-6">
                    {(plan.exercises || []).map(ex => 
                        <span key={ex.id} className="px-3 py-1 text-sm bg-slate-100 text-slate-800 rounded-md shadow-sm">
                           {ex.exerciseName} ({ex.sets}x{ex.repetitions})
                        </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const SoapNoteDetailModal: React.FC<{ note: SoapNote | null, onClose: () => void }> = ({ note, onClose }) => {
    if (!note) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg text-slate-800">Sessão #{note.sessionNumber} - {note.date}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div><strong className="font-semibold text-sky-600 block mb-1">S (Subjetivo):</strong> <MarkdownRenderer content={note.subjective} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">O (Objetivo):</strong> <MarkdownRenderer content={note.objective} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">A (Avaliação):</strong> <MarkdownRenderer content={note.assessment} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">P (Plano):</strong> <MarkdownRenderer content={note.plan} /></div>
                </main>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ icon: React.ElementType, label: string; isActive: boolean; onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center whitespace-nowrap py-3 px-4 font-medium text-sm rounded-t-lg border-b-2 ${isActive ? 'border-sky-500 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
        <Icon className="w-5 h-5 mr-2" /> {label}
    </button>
);

const PatientDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { therapists, appointments, refetch: refetchDataContext } = useData();
    const { saveAppointments, removeAppointment: deleteAppointment } = useAppointments();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(true);
    const [patientNotes, setPatientNotes] = useState<SoapNote[]>([]);
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | undefined>(undefined);
    const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
    const [isLoadingSpecificData, setIsLoadingSpecificData] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [noteForDetail, setNoteForDetail] = useState<SoapNote | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSendingReport, setIsSendingReport] = useState<number | null>(null);

    const { showToast } = useToast();

    useEffect(() => {
        if (!id) return;
        const fetchPatient = async () => {
            setIsLoadingPatient(true);
            try {
                const patientData = await patientService.getPatientById(id);
                if (patientData) {
                    setPatient(patientData);
                } else {
                    setPageError("Paciente não encontrado.");
                }
            } catch (err) {
                setPageError("Falha ao carregar dados do paciente.");
            } finally {
                setIsLoadingPatient(false);
            }
        };
        fetchPatient();
    }, [id]);

    const patientAppointments = useMemo(() => appointments.filter(a => a.patientId === id), [appointments, id]);

    const fetchPatientSpecificData = useCallback(async () => {
        if (!id) return;
        setIsLoadingSpecificData(true);
        try {
            const [notesData, planData, reportsData] = await Promise.all([
                soapNoteService.getNotesByPatientId(id),
                treatmentService.getPlanByPatientId(id),
                reportService.getReportsByPatientId(id),
            ]);
            setPatientNotes(notesData);
            setTreatmentPlan(planData);
            setMedicalReports(reportsData);
            setPageError(null);
        } catch (err) {
            setPageError("Falha ao carregar dados específicos do paciente.");
            console.error(err);
        } finally {
            setIsLoadingSpecificData(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPatientSpecificData();
    }, [fetchPatientSpecificData]);

    const handleSaveNote = async (newNoteData: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>) => {
        if (!patient) return;
        const newNote = await soapNoteService.addNote(patient.id, newNoteData);
        setPatientNotes(prevNotes => [newNote, ...prevNotes]);
        setIsSoapModalOpen(false);
    };
    
    const handleSavePatient = async (updatedData: Omit<Patient, 'id' | 'lastVisit'>) => {
        if (!patient) return;
        await patientService.updatePatient({ ...patient, ...updatedData });
        await refetchDataContext();
        setIsPatientModalOpen(false);
        showToast('Paciente atualizado com sucesso!', 'success');
    };

    const handleSaveAppointment = async (appointmentData: Appointment): Promise<boolean> => {
        const success = await saveAppointments([appointmentData]);
        if (success) setIsAppointmentModalOpen(false);
        return success;
    };
    
    const handleDeleteAppointment = async (appointmentId: string, seriesId?: string): Promise<boolean> => {
      const appointmentToDelete = patientAppointments.find(a => a.id === appointmentId);
      if (!appointmentToDelete) return false;
      const success = await deleteAppointment(appointmentId, seriesId, appointmentToDelete.startTime);
      if (success) setIsAppointmentModalOpen(false);
      return success;
    };
    
    const handleFileUpload = async () => {
        if (!selectedFile || !patient) return;
        try {
            await patientService.addAttachment(patient.id, selectedFile);
            await refetchDataContext(); // This will refetch summaries, we need to refetch the full patient
            const updatedPatient = await patientService.getPatientById(patient.id);
            if(updatedPatient) setPatient(updatedPatient);
            showToast('Arquivo anexado com sucesso!', 'success');
            setSelectedFile(null);
        } catch (error) {
            showToast('Falha ao anexar arquivo.', 'error');
        }
    };

    const handleDownloadPdf = async (report: MedicalReport) => {
        if (!patient) return;
        showToast('Gerando PDF...', 'info');
        try {
            await reportService.generatePdf(report, patient);
        } catch (error) {
            showToast('Falha ao gerar o PDF.', 'error');
        }
    };
    
    const handleSendReport = async (report: MedicalReport) => {
        if (report.status !== 'finalized') {
            showToast('Apenas relatórios finalizados podem ser enviados.', 'error');
            return;
        }
        setIsSendingReport(report.id);
        try {
            await reportService.sendReport(report.id);
            showToast('Relatório marcado como enviado!', 'success');
            fetchPatientSpecificData(); // Refetch specific data to update status
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSendingReport(null);
        }
    };


    if (isLoadingPatient || isLoadingSpecificData) return <PageLoader />;
    if (pageError) return <div className="text-center p-10 text-red-500">{pageError}</div>;
    if (!patient) return <div className="text-center p-10">Paciente não encontrado.</div>;
    
    const birthDate = new Date(patient.birthDate);
    const formattedBirthDate = !isNaN(birthDate.getTime()) ? birthDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';

    return (
        <>
            <PageHeader
                title={patient.name}
                subtitle={`Detalhes do prontuário, histórico e agendamentos.`}
            >
                <Link to="/patients" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 mr-3">
                    <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                    Voltar
                </Link>
                 <button onClick={() => setIsPatientModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                    <Edit className="-ml-1 mr-2 h-5 w-5" />
                    Editar Cadastro
                </button>
            </PageHeader>
            
            <NewSoapNoteModal isOpen={isSoapModalOpen} onClose={() => setIsSoapModalOpen(false)} onSave={handleSaveNote} />
            <PatientFormModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} patientToEdit={patient} />
            <SoapNoteDetailModal note={noteForDetail} onClose={() => setNoteForDetail(null)} />
             <AppointmentFormModal 
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                onSave={handleSaveAppointment}
                onDelete={handleDeleteAppointment}
                initialData={{ date: new Date(), therapistId: therapists[0]?.id }}
                patients={[patient]}
                therapists={therapists}
                allAppointments={appointments}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Informações Pessoais" icon={<User />}>
                        <div className="space-y-4">
                            <InfoPill icon={<Cake className="w-5 h-5"/>} label="Data de Nascimento" value={formattedBirthDate} />
                            <InfoPill icon={<Phone className="w-5 h-5"/>} label="Telefone" value={patient.phone} />
                            <InfoPill icon={<Mail className="w-5 h-5"/>} label="Email" value={patient.email} />
                        </div>
                    </InfoCard>
                    
                    {patient.conditions && patient.conditions.length > 0 && (
                        <InfoCard title="Condições / Queixas" icon={<Heart />}>
                            <ul className="space-y-3">
                                {patient.conditions.map((condition, index) => (
                                    <li key={index} className="p-3 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-slate-800">{condition.name}</p>
                                    </li>
                                ))}
                            </ul>
                        </InfoCard>
                    )}

                    {patient.surgeries && patient.surgeries.length > 0 && (
                        <InfoCard title="Histórico Cirúrgico" icon={<Heart />}>
                            <ul className="space-y-3">
                                {patient.surgeries.map((surgery, index) => {
                                    const timeSince = calculateTimeSince(surgery.date);
                                    return (
                                    <li key={index} className="p-3 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-slate-800">{surgery.name}</p>
                                        <div className="text-xs text-slate-500 mt-1">
                                            <span>{timeSince.weeks} semanas</span>
                                        </div>
                                    </li>
                                )})}
                            </ul>
                        </InfoCard>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                     <div className="border-b border-slate-200">
                        <nav className="flex space-x-2" aria-label="Tabs">
                            <TabButton icon={Layers} label="Visão Geral" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton icon={BookOpen} label="Histórico Clínico" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                            <TabButton icon={CalendarDays} label="Agendamentos" isActive={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
                            <TabButton icon={FileText} label="Laudos & Anexos" isActive={activeTab === 'docs'} onClick={() => setActiveTab('docs')} />
                        </nav>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {treatmentPlan ? <TreatmentPlanCard plan={treatmentPlan} /> : <InfoCard title="Plano de Tratamento"><p>Nenhum plano ativo.</p></InfoCard>}
                            {(patient.trackedMetrics || []).filter(m => m.isActive).map(metric => (
                                <MetricEvolutionChart key={metric.id} metric={metric} notes={patientNotes} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                         <div className="space-y-6">
                            <div className="text-right">
                                <button onClick={() => setIsSoapModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                                    <Plus className="-ml-1 mr-2 h-5 w-5" /> Nova Anotação
                                </button>
                            </div>
                            <ClinicalHistoryTimeline notes={patientNotes} onViewNote={setNoteForDetail} />
                        </div>
                    )}
                    
                    {activeTab === 'appointments' && (
                        <AppointmentTimeline appointments={patientAppointments} onAdd={() => setIsAppointmentModalOpen(true)} />
                    )}

                    {activeTab === 'docs' && (
                        <div className="space-y-6">
                             <InfoCard title="Laudos Médicos" icon={<FileText />}>
                                <div className="space-y-3 mb-4">
                                    {medicalReports.map(report => (
                                        <div key={report.id} className="p-3 bg-slate-50 rounded-lg">
                                            <p className="font-semibold text-slate-800">{report.title}</p>
                                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                                                <Link to={`/medical-report/edit/${report.id}`} className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                                                    <Edit className="w-3 h-3 mr-1.5" /> {report.status === 'draft' ? 'Editar' : 'Visualizar'}
                                                </Link>
                                                <button onClick={() => handleSendReport(report)} disabled={report.status !== 'finalized' || isSendingReport === report.id} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300">
                                                    <Send className="w-3 h-3 mr-1.5" /> Enviar
                                                </button>
                                                <button onClick={() => handleDownloadPdf(report)} disabled={report.status === 'draft'} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300">
                                                    <Download className="w-3 h-3 mr-1.5" /> PDF
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link to={`/medical-report/new/${patient.id}`} className="w-full inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                                    <Plus className="-ml-1 mr-2 h-5 w-5" /> Gerar Novo Laudo
                                </Link>
                            </InfoCard>
                            <InfoCard title="Anexos do Paciente" icon={<Paperclip />}>
                                 <div className="space-y-3 mb-4">
                                    {(patient.attachments || []).map((file, index) => (
                                        <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100">
                                            <FileText className="w-5 h-5 text-slate-500 mr-3" />
                                            <span className="text-sm text-slate-700 font-medium truncate">{file.name}</span>
                                        </a>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                     <input type="file" id="file-upload" className="hidden" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                                     <label htmlFor="file-upload" className="w-full text-center px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer truncate">
                                        {selectedFile ? selectedFile.name : 'Escolher arquivo...'}
                                    </label>
                                    <button onClick={handleFileUpload} disabled={!selectedFile} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-300">
                                        <Upload className="w-5 h-5" />
                                    </button>
                                </div>
                            </InfoCard>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default PatientDetailPage;
