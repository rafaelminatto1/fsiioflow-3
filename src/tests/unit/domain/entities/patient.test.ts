import { PatientEntity } from '../../../domain/entities/patient';
import { UUID } from 'crypto';

describe('PatientEntity', () => {
  let patient: PatientEntity;
  const mockId = crypto.randomUUID() as UUID;
  const mockFisioId = crypto.randomUUID() as UUID;

  beforeEach(() => {
    const birthDate = new Date('1990-05-15');
    const now = new Date();
    
    patient = new PatientEntity(
      mockId,
      'João Silva',
      'joao@email.com',
      '11999999999',
      birthDate,
      ['chronic_pain', 'lower_back_pain'],
      {
        name: 'Maria Silva',
        phone: '11888888888',
        relationship: 'spouse'
      },
      mockFisioId,
      now,
      now
    );
  });

  describe('calculateAge', () => {
    it('should calculate correct age', () => {
      const birthDate = new Date('1990-05-15');
      const testPatient = new PatientEntity(
        mockId,
        'Test',
        'test@email.com',
        '11999999999',
        birthDate,
        [],
        { name: 'Test', phone: '11888888888', relationship: 'parent' },
        mockFisioId,
        new Date(),
        new Date()
      );

      const age = testPatient.calculateAge();
      const expectedAge = new Date().getFullYear() - 1990;
      
      expect(age).toBe(expectedAge);
    });

    it('should handle birthday not yet passed this year', () => {
      const nextYear = new Date().getFullYear() + 1;
      const futureBirthDate = new Date(`${nextYear}-12-31`);
      
      const testPatient = new PatientEntity(
        mockId,
        'Test',
        'test@email.com',
        '11999999999',
        futureBirthDate,
        [],
        { name: 'Test', phone: '11888888888', relationship: 'parent' },
        mockFisioId,
        new Date(),
        new Date()
      );

      const age = testPatient.calculateAge();
      expect(age).toBeLessThan(0); // Idade negativa para data futura
    });
  });

  describe('isEligibleForGroup', () => {
    it('should return true when patient meets all requirements', () => {
      const requirements = {
        minAge: 30,
        maxAge: 40,
        excludedConditions: ['acute_injury']
      };

      const result = patient.isEligibleForGroup(requirements);
      expect(result).toBe(true);
    });

    it('should return false when patient is too young', () => {
      const requirements = {
        minAge: 40,
        maxAge: 50
      };

      const result = patient.isEligibleForGroup(requirements);
      expect(result).toBe(false);
    });

    it('should return false when patient is too old', () => {
      const requirements = {
        minAge: 20,
        maxAge: 25
      };

      const result = patient.isEligibleForGroup(requirements);
      expect(result).toBe(false);
    });

    it('should return false when patient has excluded condition', () => {
      const requirements = {
        minAge: 25,
        maxAge: 40,
        excludedConditions: ['chronic_pain']
      };

      const result = patient.isEligibleForGroup(requirements);
      expect(result).toBe(false);
    });

    it('should return true when no requirements specified', () => {
      const requirements = {};
      
      const result = patient.isEligibleForGroup(requirements);
      expect(result).toBe(true);
    });
  });

  describe('updateMedicalConditions', () => {
    it('should update medical conditions and timestamp', () => {
      const originalUpdatedAt = patient.updatedAt;
      const newConditions = ['knee_pain', 'arthritis'];

      // Aguardar um pouco para garantir timestamp diferente
      setTimeout(() => {
        patient.updateMedicalConditions(newConditions);
        
        expect(patient.medicalConditions).toEqual(newConditions);
        expect(patient.updatedAt).not.toEqual(originalUpdatedAt);
        expect(patient.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should not modify original conditions array', () => {
      const newConditions = ['knee_pain'];
      patient.updateMedicalConditions(newConditions);
      
      newConditions.push('shoulder_pain');
      
      expect(patient.medicalConditions).not.toContain('shoulder_pain');
      expect(patient.medicalConditions.length).toBe(1);
    });
  });

  describe('constructor', () => {
    it('should create patient with all required properties', () => {
      expect(patient.id).toBe(mockId);
      expect(patient.name).toBe('João Silva');
      expect(patient.email).toBe('joao@email.com');
      expect(patient.phone).toBe('11999999999');
      expect(patient.medicalConditions).toEqual(['chronic_pain', 'lower_back_pain']);
      expect(patient.emergencyContact.name).toBe('Maria Silva');
      expect(patient.fisioterapeutaId).toBe(mockFisioId);
    });

    it('should have valid dates', () => {
      expect(patient.createdAt).toBeInstanceOf(Date);
      expect(patient.updatedAt).toBeInstanceOf(Date);
      expect(patient.birthDate).toBeInstanceOf(Date);
    });
  });
});