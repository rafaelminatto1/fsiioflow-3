// services/partnershipService.ts
import { PartnershipClient, Patient, Voucher, SoapNote, PainLog } from '../types';
import { mockPurchasedVouchers, mockPatients, mockSoapNotes, mockPainLogs } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getEducatorClients = async (educatorId: string): Promise<PartnershipClient[]> => {
    await delay(500);
    const clients: PartnershipClient[] = [];
    
    for (const voucher of mockPurchasedVouchers) {
        // In a real system, you'd filter by educatorId
        const patient = mockPatients.find(p => p.id === voucher.patientId);
        if (patient) {
            clients.push({ patient, voucher });
        }
    }
    return clients;
};

interface IntegratedClientHistory {
    patient: Patient;
    voucher: Voucher;
    soapNotes: SoapNote[];
    painLogs: PainLog[];
}

export const getIntegratedClientHistory = async (clientId: string, educatorId: string): Promise<IntegratedClientHistory | null> => {
    await delay(700);
    
    const voucher = mockPurchasedVouchers.find(v => v.patientId === clientId);
    const patient = mockPatients.find(p => p.id === clientId);

    if (!voucher || !patient) {
        return null;
    }

    // Simulate fetching related data
    const soapNotes = mockSoapNotes.filter(note => note.patientId === clientId);
    const painLogs = mockPainLogs.filter(log => log.patientId === clientId);

    return {
        patient,
        voucher,
        soapNotes,
        painLogs
    };
};
