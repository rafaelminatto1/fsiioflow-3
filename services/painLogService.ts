
import { PainLog } from '../types';
import { mockPainLogs } from '../data/mockData';

let painLogs: PainLog[] = [...mockPainLogs];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getLogsByPatientId = async (patientId: string): Promise<PainLog[]> => {
    await delay(400);
    return [...painLogs]
        .filter(log => log.patientId === patientId)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const addLog = async (logData: Omit<PainLog, 'id'>): Promise<PainLog> => {
    await delay(300);
    const newLog: PainLog = {
        id: `pl_${Date.now()}`,
        ...logData,
    };
    painLogs.unshift(newLog);
    return newLog;
};