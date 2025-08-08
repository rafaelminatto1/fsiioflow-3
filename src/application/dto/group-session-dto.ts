import { UUID } from 'crypto';
import { GroupSession } from '../../domain/entities/group-session';

export interface CreateGroupSessionDTO {
  name: string;
  description: string;
  fisioterapeutaId: UUID;
  maxCapacity: number;
  exercises: UUID[];
  schedule: {
    days: string[];
    time: string;
    duration: number;
  };
  requirements: {
    minAge?: number;
    maxAge?: number;
    excludedConditions?: string[];
    fitnessLevel?: number;
  };
}

export interface UpdateGroupSessionDTO {
  id: UUID;
  name?: string;
  description?: string;
  maxCapacity?: number;
  exercises?: UUID[];
  schedule?: {
    days: string[];
    time: string;
    duration: number;
  };
  requirements?: {
    minAge?: number;
    maxAge?: number;
    excludedConditions?: string[];
    fitnessLevel?: number;
  };
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface GroupSessionResponseDTO {
  id: UUID;
  name: string;
  description: string;
  fisioterapeutaId: UUID;
  fisioterapeutaName?: string;
  maxCapacity: number;
  currentMembers: UUID[];
  memberCount: number;
  availableSlots: number;
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

  static fromEntity(entity: GroupSession): GroupSessionResponseDTO {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      fisioterapeutaId: entity.fisioterapeutaId,
      maxCapacity: entity.maxCapacity,
      currentMembers: entity.currentMembers,
      memberCount: entity.currentMembers.length,
      availableSlots: entity.maxCapacity - entity.currentMembers.length,
      exercises: entity.exercises,
      schedule: entity.schedule,
      status: entity.status,
      requirements: entity.requirements,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
}