
import { Patient, PatientAttachment, PatientSummary } from '../types';
import { mockPatients } from '../data/mockData';

let patients: Patient[] = [...mockPatients];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAllPatients = async (): Promise<Patient[]> => {
    await delay(500);
    const sortedPatients = [...patients].sort((a,b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    return sortedPatients;
};

export const getPatients = async ({ limit = 15, cursor, searchTerm, statusFilter }: {
    limit?: number;
    cursor?: string | null;
    searchTerm?: string;
    statusFilter?: string;
}): Promise<{ patients: PatientSummary[]; nextCursor: string | null }> => {
    await delay(500);

    let filteredPatients = [...mockPatients];

    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredPatients = filteredPatients.filter(patient =>
            patient.name.toLowerCase().includes(lowerSearchTerm) ||
            patient.cpf.includes(lowerSearchTerm)
        );
    }

    if (statusFilter && statusFilter !== 'All') {
        filteredPatients = filteredPatients.filter(patient => patient.status === statusFilter);
    }

    filteredPatients.sort((a, b) => {
        const dateA = new Date(a.registrationDate).getTime();
        const dateB = new Date(b.registrationDate).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return a.id.localeCompare(b.id);
    });

    const startIndex = cursor ? filteredPatients.findIndex(p => p.id === cursor) + 1 : 0;

    if (cursor && startIndex === 0) {
        return { patients: [], nextCursor: null };
    }

    const patientSlice = filteredPatients.slice(startIndex, startIndex + limit);
    
    const nextCursor = patientSlice.length === limit ? patientSlice[patientSlice.length - 1].id : null;

    const patientSummaries: PatientSummary[] = patientSlice.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        status: p.status,
        lastVisit: p.lastVisit,
        avatarUrl: p.avatarUrl,
        medicalAlerts: p.medicalAlerts,
    }));

    return { patients: patientSummaries, nextCursor };
};

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    await delay(300);
    return patients.find(p => p.id === id);
};

export const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>): Promise<Patient> => {
    await delay(400);
    const newPatient: Patient = {
        id: `patient_${Date.now()}`,
        ...patientData,
        lastVisit: new Date().toISOString(),
    };
    patients.unshift(newPatient);
    return newPatient;
};

export const updatePatient = async (updatedPatient: Patient): Promise<Patient> => {
    await delay(400);
    patients = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    return updatedPatient;
};

export const addAttachment = async (patientId: string, file: File): Promise<PatientAttachment> => {
    await delay(600); // simulate upload
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) {
        throw new Error('Paciente não encontrado.');
    }

    const newAttachment: PatientAttachment = {
        name: file.name,
        url: '#', // In a real app, this would be the URL from blob storage
        type: file.type,
        size: file.size,
    };

    const patient = patients[patientIndex];
    const updatedAttachments = [...(patient.attachments || []), newAttachment];
    
    patients[patientIndex] = {
        ...patient,
        attachments: updatedAttachments,
    };
    
    return newAttachment;
};
