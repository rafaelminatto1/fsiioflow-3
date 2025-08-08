import React from 'react';
import { EnrichedAppointment, AppointmentStatus } from '../types';
import { Repeat, DollarSign } from 'lucide-react';

interface AppointmentCardProps {
  appointment: EnrichedAppointment;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, appointmentId: string) => void;
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onMouseLeave: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onSelect, onDragStart, onResizeStart, onContextMenu, onMouseEnter, onMouseLeave }) => {
  const startHour = appointment.startTime.getHours();
  const startMinutes = appointment.startTime.getMinutes();
  const endHour = appointment.endTime.getHours();
  const endMinutes = appointment.endTime.getMinutes();

  const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
  const top = ((startHour - 8) * 60 + startMinutes);
  const height = duration;

  const color = appointment.therapistColor || 'slate';

  const statusClasses = {
    [AppointmentStatus.Scheduled]: `bg-${color}-100 border-${color}-500 text-${color}-800 hover:bg-${color}-200`,
    [AppointmentStatus.Completed]: 'bg-slate-100 border-slate-400 text-slate-600 hover:bg-slate-200',
    [AppointmentStatus.Canceled]: 'bg-red-100 border-red-400 text-red-700 line-through hover:bg-red-200',
    [AppointmentStatus.NoShow]: 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200',
  };

  // Tailwind JIT compiler workarounds
  // bg-teal-100 border-teal-500 text-teal-800 hover:bg-teal-200
  // bg-sky-100 border-sky-500 text-sky-800 hover:bg-sky-200
  // bg-indigo-100 border-indigo-500 text-indigo-800 hover:bg-indigo-200
  // bg-slate-100 border-slate-500 text-slate-800 hover:bg-slate-200

  const paymentStatusColor = appointment.paymentStatus === 'paid' ? 'text-green-500' : 'text-amber-500';

  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, appointment)}
      onMouseEnter={(e) => onMouseEnter(e, appointment)}
      onMouseLeave={onMouseLeave}
      draggable="true"
      onDragStart={(e) => onDragStart(e, appointment.id)}
      className={`absolute left-2 right-2 p-2 rounded-lg border-l-4 text-xs z-10 cursor-grab active:cursor-grabbing transition-colors overflow-hidden flex flex-col group ${statusClasses[appointment.status]}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
      title={`${appointment.title}\nPaciente: ${appointment.patientName}\nTipo: ${appointment.type}`}
    >
      <div className="flex justify-between items-start flex-grow">
        <div className="overflow-hidden">
          <p className="font-bold truncate">{appointment.patientName}</p>
          <p className="truncate text-xs">{appointment.type}</p>
        </div>
        <div className="flex flex-col items-end space-y-1 shrink-0">
          {appointment.seriesId && 
              <span title="Consulta Recorrente">
                  <Repeat className="w-3 h-3" />
              </span>
          }
          <span title={`Pagamento ${appointment.paymentStatus === 'paid' ? 'Realizado' : 'Pendente'}`}>
            <DollarSign className={`w-3.5 h-3.5 ${paymentStatusColor}`} />
          </span>
        </div>
      </div>
       <p className="truncate mt-1">{appointment.title}</p>
       <div 
          onMouseDown={(e) => onResizeStart(e, appointment)}
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
        >
            <div className="h-[3px] w-8 bg-slate-500/50 rounded-full mx-auto mt-1"></div>
        </div>
    </div>
  );
};

export default AppointmentCard;