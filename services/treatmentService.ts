
import { TreatmentPlan, ExercisePrescription } from '../types';
import { mockTreatmentPlans, mockExercisePrescriptions } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getPlanByPatientId = async (patientId: string): Promise<TreatmentPlan | undefined> => {
    await delay(300);
    return mockTreatmentPlans.find(p => p.patientId === patientId);
};

export const getExercisesByPlanId = async (planId: string): Promise<ExercisePrescription[]> => {
    await delay(300);
    return mockExercisePrescriptions.filter(ex => ex.treatmentPlanId === planId);
};
