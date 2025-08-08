import { Appointment } from '../types';
import { mockAppointments, mockPatients } from '../data/mockData';

let appointments: Appointment[] = [...mockAppointments];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAppointments = async (): Promise<Appointment[]> => {
    await delay(500);
    return [...appointments];
};

export const getAppointmentsByPatientId = async (patientId: string): Promise<Appointment[]> => {
    await delay(300);
    return appointments.filter(a => a.patientId === patientId);
};

export const saveAppointment = async (appointmentData: Appointment): Promise<Appointment> => {
    await delay(400);
    const patient = mockPatients.find(p => p.id === appointmentData.patientId);
    const fullAppointmentData = {
        ...appointmentData,
        patientAvatarUrl: patient?.avatarUrl || ''
    };

    const index = appointments.findIndex(a => a.id === fullAppointmentData.id);
    if (index > -1) {
        appointments[index] = fullAppointmentData;
    } else {
        appointments.push(fullAppointmentData);
    }
    return fullAppointmentData;
};

export const deleteAppointment = async (id: string): Promise<void> => {
    await delay(400);
    appointments = appointments.filter(a => a.id !== id);
};

export const deleteAppointmentSeries = async (seriesId: string, fromDate: Date): Promise<void> => {
    await delay(400);
    appointments = appointments.filter(a => !(a.seriesId === seriesId && a.startTime >= fromDate));
}