import { UUID } from 'crypto';

export interface GroupSession {
  id: UUID;
  name: string;
  description: string;
  fisioterapeutaId: UUID;
  maxCapacity: number;
  currentMembers: UUID[];
  exercises: UUID[];
  schedule: {
    days: string[];
    time: string;
    duration: number;
  };
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  requirements: {
    minAge?: number;
    maxAge?: number;
    excludedConditions?: string[];
    fitnessLevel?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class GroupSessionEntity implements GroupSession {
  constructor(
    public id: UUID,
    public name: string,
    public description: string,
    public fisioterapeutaId: UUID,
    public maxCapacity: number,
    public currentMembers: UUID[],
    public exercises: UUID[],
    public schedule: {
      days: string[];
      time: string;
      duration: number;
    },
    public status: 'active' | 'paused' | 'completed' | 'cancelled',
    public requirements: {
      minAge?: number;
      maxAge?: number;
      excludedConditions?: string[];
      fitnessLevel?: number;
    },
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  addMember(patientId: UUID): void {
    if (this.currentMembers.length >= this.maxCapacity) {
      throw new Error('Group is at maximum capacity');
    }

    if (this.currentMembers.includes(patientId)) {
      throw new Error('Patient already in group');
    }

    this.currentMembers.push(patientId);
    this.updatedAt = new Date();
  }

  removeMember(patientId: UUID): void {
    const memberIndex = this.currentMembers.indexOf(patientId);
    
    if (memberIndex === -1) {
      throw new Error('Patient not in group');
    }

    this.currentMembers.splice(memberIndex, 1);
    this.updatedAt = new Date();
  }

  isAvailableSlot(): boolean {
    return this.currentMembers.length < this.maxCapacity;
  }

  getAvailableSlots(): number {
    return this.maxCapacity - this.currentMembers.length;
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  canAcceptNewMembers(): boolean {
    return this.isActive() && this.isAvailableSlot();
  }

  updateSchedule(schedule: {
    days: string[];
    time: string;
    duration: number;
  }): void {
    this.schedule = { ...schedule };
    this.updatedAt = new Date();
  }

  changeStatus(newStatus: 'active' | 'paused' | 'completed' | 'cancelled'): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }
}