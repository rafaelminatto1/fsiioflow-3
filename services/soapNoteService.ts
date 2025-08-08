import { SoapNote } from '../types';
import { mockSoapNotes } from '../data/mockData';

let notes: SoapNote[] = [...mockSoapNotes];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getNotesByPatientId = async (patientId: string): Promise<SoapNote[]> => {
    await delay(300);
    return [...notes]
        .filter(n => n.patientId === patientId)
        .sort((a,b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());
};

export const addNote = async (patientId: string, noteData: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>): Promise<SoapNote> => {
    await delay(400);
    const newNote: SoapNote = {
        id: `note_${Date.now()}`,
        patientId,
        therapist: 'Dr. Roberto', // Assuming logged in user
        ...noteData
    };
    notes.unshift(newNote);
    return newNote;
};

export const saveNote = async (noteData: Partial<SoapNote> & { patientId: string }): Promise<SoapNote> => {
    await delay(300);
    if (noteData.id) {
        // Update existing note
        const index = notes.findIndex(n => n.id === noteData.id);
        if (index > -1) {
            notes[index] = { ...notes[index], ...noteData } as SoapNote;
            return notes[index];
        }
    }
    // Create new note if ID doesn't exist
    const newNote: SoapNote = {
        id: `note_${Date.now()}`,
        therapist: 'Dr. Roberto', // Assuming logged in user
        date: new Date().toLocaleDateString('pt-BR'),
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        ...noteData,
    };
    notes.unshift(newNote);
    return newNote;
};
