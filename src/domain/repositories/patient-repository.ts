import { UUID } from 'crypto';
import { Patient } from '../entities/patient';

export interface PatientRepository {
  create(patient: Patient): Promise<Patient>;
  getById(patientId: UUID): Promise<Patient | null>;
  getByFisioterapeuta(fisioterapeutaId: UUID): Promise<Patient[]>;
  getAll(): Promise<Patient[]>;
  update(patient: Patient): Promise<Patient>;
  delete(patientId: UUID): Promise<boolean>;
  search(criteria: PatientSearchCriteria): Promise<Patient[]>;
  findByConditions(conditions: string[]): Promise<Patient[]>;
  findEligibleForGroup(groupRequirements: {
    minAge?: number;
    maxAge?: number;
    excludedConditions?: string[];
  }): Promise<Patient[]>;
}

export interface PatientSearchCriteria {
  name?: string;
  email?: string;
  phone?: string;
  conditions?: string[];
  fisioterapeutaId?: UUID;
  ageRange?: {
    min: number;
    max: number;
  };
  createdAfter?: Date;
  createdBefore?: Date;
}