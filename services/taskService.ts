// services/taskService.ts
import { Task } from '../types';
import { mockTasks } from '../data/mockData';

let tasks: Task[] = [...mockTasks];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTasks = async (): Promise<Task[]> => {
    await delay(500);
    return [...tasks];
};

export const saveTask = async (taskData: Omit<Task, 'id' | 'actorUserId'> & { id?: string }, actorUserId: string): Promise<Task> => {
    await delay(400);

    if (taskData.id) {
        // Update
        const updatedTask = { ...tasks.find(t => t.id === taskData.id)!, ...taskData, actorUserId };
        tasks = tasks.map(t => (t.id === taskData.id ? updatedTask : t));
        return updatedTask;
    } else {
        // Create
        const newTask: Task = {
            id: `task_${Date.now()}`,
            ...taskData,
            actorUserId,
        };
        tasks.unshift(newTask);
        return newTask;
    }
};