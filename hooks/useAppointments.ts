// hooks/useAppointments.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Appointment, EnrichedAppointment, AppointmentType, Patient, Therapist } from '../types';
import * as appointmentService from '../services/appointmentService';
import * as patientService from '../services/patientService';
import * as therapistService from '../services/therapistService';
import { useToast } from '../contexts/ToastContext';
import { findConflict } from '../services/scheduling/conflictDetection';
import { schedulingSettingsService } from '../services/schedulingSettingsService';
import { generateRecurrences } from '../services/scheduling/recurrenceService';
import { useData } from '../contexts/DataContext';
import * as whatsappService from '../services/whatsappService';

interface UseAppointmentsResult {
  appointments: EnrichedAppointment[];
  isLoading: boolean;
  error: Error | null;
  saveAppointments: (appointmentsToSave: Appointment[]) => Promise<boolean>;
  updateSingleAppointment: (id: string, updates: Partial<Appointment>) => Promise<boolean>;
  removeAppointment: (id: string, seriesId?: string, fromDate?: Date) => Promise<boolean>;
  refetch: () => void;
}

export const useAppointments = (): UseAppointmentsResult => {
  const { appointments: allAppointments, enrichedAppointments, patients, isLoading, error, refetch: refetchData } = useData();
  const { showToast } = useToast();

  const validateAndSave = useCallback(async (appointmentsToSave: Appointment[], isEditing: boolean = false): Promise<boolean> => {
    const editingId = isEditing ? appointmentsToSave[0].id : undefined;

    // Use context data for validation to avoid another fetch
    const conflict = findConflict(appointmentsToSave, allAppointments, editingId);
    if (conflict) {
        showToast(`Conflito detectado com a consulta de ${conflict.patientName}.`, "error");
        return false;
    }

    for (const appToSave of appointmentsToSave) {
        const { isPatientLimitFull, isEvalLimitFull, patientCount, patientLimit, evalCount, evalLimit } = schedulingSettingsService.getSlotOccupancy(appToSave.startTime, allAppointments, editingId);

        if (isPatientLimitFull) {
            showToast(`O horário das ${appToSave.startTime.toTimeString().slice(0, 5)} está lotado (${patientCount}/${patientLimit} pacientes).`, "error");
            return false;
        }

        if (appToSave.type === AppointmentType.Evaluation && isEvalLimitFull) {
            showToast(`O limite de ${evalLimit} avaliação(ões) por horário foi atingido (${evalCount}/${evalLimit}).`, "error");
            return false;
        }
    }

    try {
      await Promise.all(appointmentsToSave.map(app => appointmentService.saveAppointment(app)));
      await refetchData(); // Refetch all data to update the view
      return true;
    } catch (err) {
      console.error("Failed to save appointments:", err);
      showToast("Falha ao salvar consulta(s).", "error");
      return false;
    }
  }, [allAppointments, showToast, refetchData]);

  const saveAppointments = async (appointmentsToSave: Appointment[]): Promise<boolean> => {
      const isEditing = !!appointmentsToSave[0]?.id && allAppointments.some(a => a.id === appointmentsToSave[0].id);
      
      const singleAppointment = appointmentsToSave[0];
      const allAppointmentsToProcess = singleAppointment.recurrenceRule
          ? generateRecurrences(singleAppointment)
          : appointmentsToSave;

      if (isEditing && singleAppointment.seriesId) {
          if (window.confirm("Esta é uma consulta recorrente. Deseja aplicar esta alteração a todas as futuras ocorrências?")) {
               // This is a simplified approach. A real app would need a more robust way to handle series updates.
              await appointmentService.deleteAppointmentSeries(singleAppointment.seriesId, singleAppointment.startTime);
          }
      }
      
      const success = await validateAndSave(allAppointmentsToProcess, isEditing);
      if (success) {
          showToast(isEditing ? 'Consulta atualizada com sucesso!' : 'Consulta(s) criada(s) com sucesso!', 'success');
          if (!isEditing) {
              const patient = patients.find(p => p.id === singleAppointment.patientId);
              if (patient && patient.whatsappConsent === 'opt-in') {
                  whatsappService.sendAppointmentConfirmation(singleAppointment, patient);
              }
          }
      }
      return success;
  };
  
  const updateSingleAppointment = async (id: string, updates: Partial<Appointment>): Promise<boolean> => {
      const appointmentToUpdate = allAppointments.find(a => a.id === id);
      if (!appointmentToUpdate) {
          showToast("Agendamento não encontrado.", "error");
          return false;
      }
      
      const updatedAppointment = { ...appointmentToUpdate, ...updates };
      
      // Call validateAndSave directly to bypass recurrence logic for simple updates
      const success = await validateAndSave([updatedAppointment], true);
      if (success) {
          showToast(`Consulta de ${updatedAppointment.patientName} atualizada.`, 'success');
      }
      return success;
  };

  const removeAppointment = async (id: string, seriesId?: string, fromDate?: Date): Promise<boolean> => {
    try {
      if (seriesId && fromDate) {
        await appointmentService.deleteAppointmentSeries(seriesId, fromDate);
      } else {
        await appointmentService.deleteAppointment(id);
      }
      showToast("Agendamento(s) removido(s) com sucesso.", "success");
      await refetchData();
      return true;
    } catch (err) {
      console.error("Failed to remove appointment(s):", err);
      showToast("Falha ao remover agendamento(s).", "error");
      return false;
    }
  };


  return { 
    appointments: enrichedAppointments, 
    isLoading, 
    error, 
    saveAppointments,
    updateSingleAppointment,
    removeAppointment,
    refetch: refetchData 
  };
};