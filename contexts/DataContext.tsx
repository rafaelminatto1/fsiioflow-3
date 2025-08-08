
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Patient, Appointment, Therapist, EnrichedAppointment } from '../types';
import * as patientService from '../services/patientService';
import * as appointmentService from '../services/appointmentService';
import * as therapistService from '../services/therapistService';
import PageLoader from '../components/ui/PageLoader';

interface DataContextType {
  patients: Patient[];
  appointments: Appointment[];
  therapists: Therapist[];
  enrichedAppointments: EnrichedAppointment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Don't set loading to true on refetch to avoid flashing the loader
    if (!isLoading) setIsLoading(true);
    try {
      const [patientsData, appointmentsData, therapistsData] = await Promise.all([
        patientService.getAllPatients(),
        appointmentService.getAppointments(),
        therapistService.getTherapists(),
      ]);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setTherapists(therapistsData);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrichedAppointments = React.useMemo((): EnrichedAppointment[] => {
    const patientMap = new Map<string, Patient>(patients.map(p => [p.id, p]));
    const therapistMap = new Map<string, Therapist>(therapists.map(t => [t.id, t]));

    return appointments.map(app => ({
        ...app,
        patientPhone: patientMap.get(app.patientId)?.phone || '',
        therapistColor: therapistMap.get(app.therapistId)?.color || 'slate',
        patientMedicalAlerts: patientMap.get(app.patientId)?.medicalAlerts,
    }));
  }, [appointments, patients, therapists]);

  if (isLoading) {
    return <PageLoader />;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Falha ao carregar dados essenciais: {error.message}</div>;
  }

  return (
    <DataContext.Provider value={{
      patients,
      appointments,
      therapists,
      enrichedAppointments,
      isLoading,
      error,
      refetch: fetchData,
      setPatients,
      setAppointments
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
