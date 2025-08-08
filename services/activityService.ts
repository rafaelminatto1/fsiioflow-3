
// services/activityService.ts
import { RecentActivity } from '../types';
import { mockPainLogs, mockPatients } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
    await delay(400);

    const patientMap = new Map(mockPatients.map(p => [p.id, p]));
    
    // Convert pain logs into activities
    const activities: RecentActivity[] = mockPainLogs.slice(0, 5).map(log => {
        const patient = patientMap.get(log.patientId);
        return {
            id: `act_pl_${log.id}`,
            type: 'pain_log',
            patientId: log.patientId,
            patientName: patient?.name || 'Desconhecido',
            patientAvatarUrl: patient?.avatarUrl || '',
            summary: `Registrou dor nível ${log.painLevel}/10`,
            timestamp: log.date,
        };
    });
    
    // Sort by most recent
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};
