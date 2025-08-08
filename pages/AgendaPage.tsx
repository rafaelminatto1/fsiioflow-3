import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Users, Calendar, AlertTriangle, Home, CheckCircle, DollarSign, Edit, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Appointment, EnrichedAppointment, Patient, Therapist, AppointmentStatus, AppointmentType } from '../types';
import AppointmentFormModal from '../components/AppointmentFormModal';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import AppointmentCard from '../components/AppointmentCard';
import Skeleton from '../components/ui/Skeleton';
import { useAppointments } from '../hooks/useAppointments';
import { useToast } from '../contexts/ToastContext';
import { schedulingSettingsService } from '../services/schedulingSettingsService';
import SaturdayScaleModal from '../components/SaturdayScaleModal';
import PatientTooltip from '../components/PatientTooltip';
import AppointmentContextMenu from '../components/AppointmentContextMenu';
import { useData } from '../contexts/DataContext';

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM (19:00)

const AgendaPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSaturdayModalOpen, setIsSaturdayModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | undefined>(undefined);
  const [modalInitialData, setModalInitialData] = useState<{ date: Date, therapistId?: string } | undefined>(undefined);
  
  // Drag-and-drop state
  const [draggedOverSlot, setDraggedOverSlot] = useState<string | null>(null);
  
  // Hooks
  const { appointments, isLoading: isLoadingAppointments, error: appointmentsError, saveAppointments, updateSingleAppointment, removeAppointment } = useAppointments();
  const { patients: allPatients, therapists: allTherapists, isLoading: isDataContextLoading, error: dataContextError } = useData();
  const { showToast } = useToast();
  
  // New interaction states
  const [tooltip, setTooltip] = useState<{ appointment: EnrichedAppointment, x: number, y: number } | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ appointment: EnrichedAppointment, x: number, y: number } | null>(null);
  const [resizingAppointment, setResizingAppointment] = useState<{ appointment: EnrichedAppointment, startY: number, initialHeight: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isLoading = isLoadingAppointments || isDataContextLoading;
  const error = appointmentsError || dataContextError;
  
  // --- Date & View Navigation ---
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const startOfWeek = useCallback((date: Date) => {
    const dt = new Date(date);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1); // Start week on Monday
    return new Date(dt.setDate(diff));
  }, []);

  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(startOfWeek(currentDate), i)), [currentDate, startOfWeek]); // Mon-Sat

  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if(viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (amount * 7));
    } else {
        newDate.setDate(newDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  }
  
  const goToToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
      if (viewMode === 'week') {
          return startOfWeek(currentDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // --- Modal Handlers ---
  const handleSelectAppointment = (appointment: EnrichedAppointment) => {
      setSelectedAppointment(appointment);
      setIsDetailModalOpen(true);
  };
  
  const handleEditFromDetail = (appointment: Appointment) => {
    setIsDetailModalOpen(false);
    setSelectedAppointment(appointment as EnrichedAppointment);
    setModalInitialData(undefined);
    setIsFormModalOpen(true);
  };

  const handleOpenFormToCreate = (date?: Date, therapistId?: string) => {
    setSelectedAppointment(undefined);
    setModalInitialData({ date: date || new Date(), therapistId });
    setIsFormModalOpen(true);
  };
  
  const handleSaveForm = async (appointmentData: Appointment): Promise<boolean> => {
    const success = await saveAppointments([appointmentData]);
    if (success) {
      setIsFormModalOpen(false);
    }
    return success;
  };
  
  const handleDeleteFromForm = async (appointmentId: string, seriesId?: string): Promise<boolean> => {
      if (!selectedAppointment) return false;
      const success = await removeAppointment(appointmentId, seriesId, selectedAppointment.startTime);
      if(success) {
        setIsFormModalOpen(false);
      }
      return success;
  };
  
  // --- Direct Appointment Update Handlers ---
  const handleStatusChangeFromDetail = async (appointment: Appointment, newStatus: AppointmentStatus) => {
      const success = await updateSingleAppointment(appointment.id, { status: newStatus });
      if (success) {
          setSelectedAppointment(prev => prev ? {...prev, status: newStatus} : undefined);
      }
  };

  const handlePaymentStatusChangeFromDetail = async (appointment: Appointment, newPaymentStatus: 'paid' | 'pending') => {
      const success = await updateSingleAppointment(appointment.id, { paymentStatus: newPaymentStatus });
      if (success) {
          setSelectedAppointment(prev => prev ? {...prev, paymentStatus: newPaymentStatus} : undefined);
      }
  };

  const handleUpdateAppointmentValue = async (appointmentId: string, newValue: number) => {
    const success = await updateSingleAppointment(appointmentId, { value: newValue });
    if (success) {
        setSelectedAppointment(prev => prev ? {...prev, value: newValue} : undefined);
    }
  };
  
  const handleDeleteFromDetail = async (appointmentId: string) => {
    const success = await removeAppointment(appointmentId);
    if (success) {
      setIsDetailModalOpen(false);
    }
  };
  
  // --- Drag, Resize, Tooltip, Context Menu Handlers ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appointmentId: string) => {
      e.dataTransfer.setData("appointmentId", appointmentId);
      if (contextMenu) setContextMenu(null);
      if (tooltip) setTooltip(null);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, date: Date, therapistId?: string) => {
      e.preventDefault();
      setDraggedOverSlot(null);
      const appointmentId = e.dataTransfer.getData("appointmentId");
      const droppedAppointment = appointments.find(a => a.id === appointmentId);

      if (droppedAppointment) {
          const duration = droppedAppointment.endTime.getTime() - droppedAppointment.startTime.getTime();
          const newEndTime = new Date(date.getTime() + duration);
          const newTherapistId = viewMode === 'day' ? therapistId! : droppedAppointment.therapistId;

          await updateSingleAppointment(appointmentId, { startTime: date, endTime: newEndTime, therapistId: newTherapistId });
      }
  };
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = window.setTimeout(() => {
        setTooltip({ appointment, x: e.pageX, y: e.pageY });
    }, 500);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setTooltip(null);
  };
  
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
    e.preventDefault();
    setContextMenu({ appointment, x: e.pageX, y: e.pageY });
  };
  
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
    e.preventDefault();
    e.stopPropagation();
    const duration = appointment.endTime.getTime() - appointment.startTime.getTime();
    const initialHeight = (duration / (1000 * 60)); // Height in minutes
    setResizingAppointment({ appointment, startY: e.clientY, initialHeight });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!resizingAppointment) return;
    
    const dy = e.clientY - resizingAppointment.startY;
    let newHeight = resizingAppointment.initialHeight + dy;
    newHeight = Math.round(newHeight / 15) * 15; // Snap to 15-minute intervals
    newHeight = Math.max(15, newHeight); // Minimum 15-minute duration

    const card = document.querySelector(`[data-id="${resizingAppointment.appointment.id}"]`) as HTMLDivElement;
    if (card) {
      card.style.height = `${newHeight}px`;
    }
  };

  const handleMouseUp = async () => {
    if (!resizingAppointment) return;
    
    const card = document.querySelector(`[data-id="${resizingAppointment.appointment.id}"]`) as HTMLDivElement;
    if (card) {
      const newHeight = parseFloat(card.style.height);
      const newDurationMs = newHeight * 60 * 1000;
      const newEndTime = new Date(resizingAppointment.appointment.startTime.getTime() + newDurationMs);

      const success = await updateSingleAppointment(resizingAppointment.appointment.id, { endTime: newEndTime });
      if (!success) {
          // Revert visual change on failure
          card.style.height = `${resizingAppointment.initialHeight}px`;
      }
    }
    setResizingAppointment(null);
  };
  
  // --- Rendering Logic ---

  const GridColumn = ({ date, therapist }: { date: Date; therapist?: Therapist }) => {
    const dayKey = date.toDateString();
    
    const dayAppointments = useMemo(() => 
        appointments.filter(app => 
            app.startTime.toDateString() === dayKey && 
            (viewMode === 'week' || app.therapistId === therapist!.id)
        ), 
    [appointments, dayKey, viewMode, therapist]);

    return (
      <div className="relative border-l border-slate-200 h-full">
        {hours.map((hour) => {
            const slotDate = new Date(new Date(date).setHours(hour, 0, 0, 0));
            const slotKey = `${dayKey}-${hour}-${therapist?.id || ''}`;
            const { isFull } = schedulingSettingsService.getSlotOccupancy(slotDate, appointments as Appointment[]);
            
            return (
                <div
                    key={hour}
                    onDrop={(e) => handleDrop(e, slotDate, therapist?.id)}
                    onDragOver={(e) => { e.preventDefault(); setDraggedOverSlot(slotKey); }}
                    onDragLeave={() => setDraggedOverSlot(null)}
                    onClick={!isFull ? () => handleOpenFormToCreate(slotDate, therapist?.id) : undefined}
                    className={`h-[60px] border-t border-slate-200 relative transition-colors ${
                        draggedOverSlot === slotKey ? 'bg-green-100' :
                        isFull ? 'bg-slate-100/80 cursor-not-allowed' : 'hover:bg-sky-50/50 cursor-pointer'
                    }`}
                >
                    {isFull && !draggedOverSlot && <span className="absolute top-1 left-1 text-xs text-slate-400 font-semibold">Lotado</span>}
                </div>
            );
        })}
        {dayAppointments.map(app => (
            <div key={app.id} data-id={app.id}>
                 <AppointmentCard
                    appointment={app} 
                    onSelect={() => handleSelectAppointment(app)} 
                    onDragStart={handleDragStart} 
                    onResizeStart={handleResizeStart}
                    onContextMenu={handleContextMenu}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
            </div>
        ))}
      </div>
    );
  };
  
  const renderGrid = (cols: (Date | Therapist)[], colRenderer: (col: any, index: number) => React.ReactNode) => (
     <div ref={gridRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          className={`grid grid-cols-[3.5rem_repeat(${cols.length},minmax(0,1fr))]`}>
        {/* Time column */}
        <div className="relative">
            {hours.map(hour => (
                <div key={hour} className="h-[60px] text-right pr-2">
                    <span className="relative -top-2 text-xs text-slate-400">{hour}:00</span>
                </div>
            ))}
        </div>
        {cols.map(colRenderer)}
    </div>
  );
  
  const renderWeekView = () => renderGrid(weekDays, (day: Date, index) => (
      <React.Fragment key={day.toISOString()}>
        <GridColumn date={day} />
      </React.Fragment>
  ));

  const renderDayView = () => renderGrid(allTherapists, (therapist: Therapist, index) => (
      <React.Fragment key={therapist.id}>
        <GridColumn date={currentDate} therapist={therapist} />
      </React.Fragment>
  ));
  
  const renderHeader = () => {
      const cols = viewMode === 'week' ? weekDays : allTherapists;
      return (
         <div className={`grid grid-cols-[3.5rem_repeat(${cols.length},minmax(0,1fr))]`}>
            <div className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-center"><Clock className="w-4 h-4" /></div>
            {viewMode === 'week' ?
                weekDays.map((day: Date) => (
                    <div key={day.toISOString()} className={`p-4 text-center border-l border-slate-200 ${day.toDateString() === new Date().toDateString() ? 'bg-sky-50' : ''}`}>
                        <p className="text-xs font-medium text-slate-500 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                        <p className={`text-2xl font-bold ${day.toDateString() === new Date().toDateString() ? 'text-sky-600' : 'text-slate-800'}`}>{day.getDate()}</p>
                    </div>
                )) :
                allTherapists.map((therapist: Therapist) => (
                    <div key={therapist.id} className="p-4 text-center border-l border-slate-200">
                        <img src={therapist.avatarUrl} alt={therapist.name} className="w-8 h-8 rounded-full mx-auto mb-1"/>
                        <p className={`font-bold text-sm text-${therapist.color}-600`}>{therapist.name}</p>
                    </div>
                ))
            }
        </div>
      );
  }

  return (
    <>
      <PageHeader title="Agenda" subtitle="Visualize e gerencie suas consultas.">
        <div className="flex items-center space-x-2">
            <div className="flex items-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
              <button onClick={() => changeDate(-1)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100" title="Ir para hoje"><Home className="w-4 h-4"/></button>
              <button onClick={() => changeDate(1)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md"><ChevronRight className="h-5 w-5" /></button>
            </div>
             <h3 className="text-sm font-semibold text-slate-700 px-4 text-center w-52 hidden lg:block">{getHeaderTitle()}</h3>
            <div className="flex items-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
                <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'day' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Users className="w-4 h-4 inline mr-2"/>Dia</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'week' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Calendar className="w-4 h-4 inline mr-2"/>Semana</button>
            </div>
            <button onClick={() => setIsSaturdayModalOpen(true)} className="ml-2 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Ver Escala</button>
            <button onClick={() => handleOpenFormToCreate()} className="ml-2 inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600"><Plus className="-ml-1 mr-2 h-5 w-5"/>Agendar</button>
        </div>
      </PageHeader>
      
      {isDetailModalOpen && (
        <AppointmentDetailModal
            appointment={selectedAppointment as Appointment | null}
            patient={allPatients.find(p => p.id === selectedAppointment?.patientId)}
            therapist={allTherapists.find(t => t.id === selectedAppointment?.therapistId)}
            onClose={() => setIsDetailModalOpen(false)}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
            onStatusChange={handleStatusChangeFromDetail}
            onPaymentStatusChange={handlePaymentStatusChangeFromDetail}
            onPackagePayment={() => {}}
            onUpdateValue={handleUpdateAppointmentValue}
        />
      )}

      <AppointmentFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        onDelete={handleDeleteFromForm}
        appointmentToEdit={selectedAppointment}
        initialData={modalInitialData}
        patients={allPatients}
        therapists={allTherapists}
        allAppointments={appointments as Appointment[]}
      />
      
      <SaturdayScaleModal
        isOpen={isSaturdayModalOpen}
        onClose={() => setIsSaturdayModalOpen(false)}
        appointments={appointments as Appointment[]}
      />
      
      {tooltip && <PatientTooltip appointment={tooltip.appointment} x={tooltip.x} y={tooltip.y} />}

      {contextMenu && (
        <AppointmentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onSetStatus={(status) => updateSingleAppointment(contextMenu.appointment.id, { status })}
          onSetPayment={(status) => updateSingleAppointment(contextMenu.appointment.id, { paymentStatus: status })}
          onEdit={() => {
              setContextMenu(null);
              // Delay opening the modal slightly to ensure the context menu is gone
              setTimeout(() => {
                  setSelectedAppointment(contextMenu.appointment);
                  setIsFormModalOpen(true);
              }, 50);
          }}
          onDelete={() => { if(window.confirm('Excluir esta consulta?')) removeAppointment(contextMenu.appointment.id); }}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {renderHeader()}
        {isLoading ? (
             <div className="relative h-[calc(12*60px)]">
                <Skeleton className="w-full h-full" />
             </div>
        ) : error ? (
            <div className="text-center p-10 text-red-500">{error.message}</div>
        ) : (
            <div className="relative h-[calc(12*60px)] overflow-y-auto">
                {viewMode === 'week' ? renderWeekView() : renderDayView()}
            </div>
        )}
      </div>
    </>
  );
};

export default AgendaPage;
