import { UUID } from 'crypto';
import { GroupSession } from '../entities/group-session';

export interface GroupSessionRepository {
  create(groupSession: GroupSession): Promise<GroupSession>;
  getById(groupId: UUID): Promise<GroupSession | null>;
  getByFisioterapeuta(fisioterapeutaId: UUID): Promise<GroupSession[]>;
  getAll(): Promise<GroupSession[]>;
  update(groupSession: GroupSession): Promise<GroupSession>;
  delete(groupId: UUID): Promise<boolean>;
  findByStatus(status: 'active' | 'paused' | 'completed' | 'cancelled'): Promise<GroupSession[]>;
  findWithAvailableSlots(): Promise<GroupSession[]>;
  findByPatient(patientId: UUID): Promise<GroupSession[]>;
  search(criteria: GroupSessionSearchCriteria): Promise<GroupSession[]>;
}

export interface GroupSessionSearchCriteria {
  name?: string;
  fisioterapeutaId?: UUID;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  hasAvailableSlots?: boolean;
  scheduleDays?: string[];
  maxCapacity?: {
    min?: number;
    max?: number;
  };
  createdAfter?: Date;
  createdBefore?: Date;
}