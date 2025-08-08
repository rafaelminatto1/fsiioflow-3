import { UUID } from 'crypto';

export interface Patient {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  medicalConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  fisioterapeutaId: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export class PatientEntity implements Patient {
  constructor(
    public id: UUID,
    public name: string,
    public email: string,
    public phone: string,
    public birthDate: Date,
    public medicalConditions: string[],
    public emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    },
    public fisioterapeutaId: UUID,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  calculateAge(): number {
    const today = new Date();
    const age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }

  isEligibleForGroup(groupRequirements: {
    minAge?: number;
    maxAge?: number;
    excludedConditions?: string[];
  }): boolean {
    const age = this.calculateAge();
    
    // Verificar idade
    if (groupRequirements.minAge && age < groupRequirements.minAge) {
      return false;
    }
    
    if (groupRequirements.maxAge && age > groupRequirements.maxAge) {
      return false;
    }
    
    // Verificar condições excludentes
    if (groupRequirements.excludedConditions) {
      const hasExcludedCondition = this.medicalConditions.some(condition =>
        groupRequirements.excludedConditions!.includes(condition)
      );
      if (hasExcludedCondition) {
        return false;
      }
    }
    
    return true;
  }

  updateMedicalConditions(conditions: string[]): void {
    this.medicalConditions = [...conditions];
    this.updatedAt = new Date();
  }
}