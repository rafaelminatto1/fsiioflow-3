import { GroupSessionEntity } from '../../../domain/entities/group-session';
import { UUID } from 'crypto';

describe('GroupSessionEntity', () => {
  let groupSession: GroupSessionEntity;
  const mockId = crypto.randomUUID() as UUID;
  const mockFisioId = crypto.randomUUID() as UUID;
  const mockPatientId1 = crypto.randomUUID() as UUID;
  const mockPatientId2 = crypto.randomUUID() as UUID;
  const mockExerciseId = crypto.randomUUID() as UUID;

  beforeEach(() => {
    const now = new Date();
    
    groupSession = new GroupSessionEntity(
      mockId,
      'Pilates Avançado',
      'Grupo de pilates para nível avançado',
      mockFisioId,
      6,
      [],
      [mockExerciseId],
      {
        days: ['monday', 'wednesday', 'friday'],
        time: '14:00',
        duration: 60
      },
      'active',
      {
        minAge: 25,
        maxAge: 45,
        excludedConditions: ['acute_injury']
      },
      now,
      now
    );
  });

  describe('addMember', () => {
    it('should add member successfully when slot is available', () => {
      expect(groupSession.currentMembers.length).toBe(0);
      
      groupSession.addMember(mockPatientId1);
      
      expect(groupSession.currentMembers.length).toBe(1);
      expect(groupSession.currentMembers).toContain(mockPatientId1);
    });

    it('should throw error when group is at maximum capacity', () => {
      // Preencher grupo até capacidade máxima
      for (let i = 0; i < groupSession.maxCapacity; i++) {
        const patientId = crypto.randomUUID() as UUID;
        groupSession.addMember(patientId);
      }

      expect(() => {
        groupSession.addMember(crypto.randomUUID() as UUID);
      }).toThrow('Group is at maximum capacity');
    });

    it('should throw error when patient is already in group', () => {
      groupSession.addMember(mockPatientId1);
      
      expect(() => {
        groupSession.addMember(mockPatientId1);
      }).toThrow('Patient already in group');
    });

    it('should update timestamp when adding member', () => {
      const originalUpdatedAt = groupSession.updatedAt;
      
      setTimeout(() => {
        groupSession.addMember(mockPatientId1);
        expect(groupSession.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });
  });

  describe('removeMember', () => {
    beforeEach(() => {
      groupSession.addMember(mockPatientId1);
      groupSession.addMember(mockPatientId2);
    });

    it('should remove member successfully', () => {
      expect(groupSession.currentMembers.length).toBe(2);
      
      groupSession.removeMember(mockPatientId1);
      
      expect(groupSession.currentMembers.length).toBe(1);
      expect(groupSession.currentMembers).not.toContain(mockPatientId1);
      expect(groupSession.currentMembers).toContain(mockPatientId2);
    });

    it('should throw error when patient is not in group', () => {
      const nonMemberPatientId = crypto.randomUUID() as UUID;
      
      expect(() => {
        groupSession.removeMember(nonMemberPatientId);
      }).toThrow('Patient not in group');
    });

    it('should update timestamp when removing member', () => {
      const originalUpdatedAt = groupSession.updatedAt;
      
      setTimeout(() => {
        groupSession.removeMember(mockPatientId1);
        expect(groupSession.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });
  });

  describe('isAvailableSlot', () => {
    it('should return true when group has available slots', () => {
      expect(groupSession.isAvailableSlot()).toBe(true);
    });

    it('should return false when group is at maximum capacity', () => {
      // Preencher até capacidade máxima
      for (let i = 0; i < groupSession.maxCapacity; i++) {
        const patientId = crypto.randomUUID() as UUID;
        groupSession.addMember(patientId);
      }
      
      expect(groupSession.isAvailableSlot()).toBe(false);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return correct number of available slots', () => {
      expect(groupSession.getAvailableSlots()).toBe(6);
      
      groupSession.addMember(mockPatientId1);
      expect(groupSession.getAvailableSlots()).toBe(5);
      
      groupSession.addMember(mockPatientId2);
      expect(groupSession.getAvailableSlots()).toBe(4);
    });

    it('should return 0 when group is full', () => {
      for (let i = 0; i < groupSession.maxCapacity; i++) {
        const patientId = crypto.randomUUID() as UUID;
        groupSession.addMember(patientId);
      }
      
      expect(groupSession.getAvailableSlots()).toBe(0);
    });
  });

  describe('isActive', () => {
    it('should return true when status is active', () => {
      expect(groupSession.isActive()).toBe(true);
    });

    it('should return false when status is not active', () => {
      groupSession.changeStatus('paused');
      expect(groupSession.isActive()).toBe(false);
      
      groupSession.changeStatus('completed');
      expect(groupSession.isActive()).toBe(false);
      
      groupSession.changeStatus('cancelled');
      expect(groupSession.isActive()).toBe(false);
    });
  });

  describe('canAcceptNewMembers', () => {
    it('should return true when active and has available slots', () => {
      expect(groupSession.canAcceptNewMembers()).toBe(true);
    });

    it('should return false when not active', () => {
      groupSession.changeStatus('paused');
      expect(groupSession.canAcceptNewMembers()).toBe(false);
    });

    it('should return false when no available slots', () => {
      for (let i = 0; i < groupSession.maxCapacity; i++) {
        const patientId = crypto.randomUUID() as UUID;
        groupSession.addMember(patientId);
      }
      
      expect(groupSession.canAcceptNewMembers()).toBe(false);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule and timestamp', () => {
      const originalUpdatedAt = groupSession.updatedAt;
      const newSchedule = {
        days: ['tuesday', 'thursday'],
        time: '16:00',
        duration: 45
      };

      setTimeout(() => {
        groupSession.updateSchedule(newSchedule);
        
        expect(groupSession.schedule).toEqual(newSchedule);
        expect(groupSession.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should not modify original schedule object', () => {
      const newSchedule = {
        days: ['tuesday', 'thursday'],
        time: '16:00',
        duration: 45
      };

      groupSession.updateSchedule(newSchedule);
      newSchedule.days.push('saturday');
      
      expect(groupSession.schedule.days).not.toContain('saturday');
      expect(groupSession.schedule.days.length).toBe(2);
    });
  });

  describe('changeStatus', () => {
    it('should change status and update timestamp', () => {
      const originalUpdatedAt = groupSession.updatedAt;
      
      setTimeout(() => {
        groupSession.changeStatus('paused');
        
        expect(groupSession.status).toBe('paused');
        expect(groupSession.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should allow all valid status transitions', () => {
      const validStatuses: Array<'active' | 'paused' | 'completed' | 'cancelled'> = 
        ['active', 'paused', 'completed', 'cancelled'];

      validStatuses.forEach(status => {
        expect(() => {
          groupSession.changeStatus(status);
        }).not.toThrow();
        
        expect(groupSession.status).toBe(status);
      });
    });
  });

  describe('constructor', () => {
    it('should create group session with all properties', () => {
      expect(groupSession.id).toBe(mockId);
      expect(groupSession.name).toBe('Pilates Avançado');
      expect(groupSession.fisioterapeutaId).toBe(mockFisioId);
      expect(groupSession.maxCapacity).toBe(6);
      expect(groupSession.currentMembers).toEqual([]);
      expect(groupSession.exercises).toEqual([mockExerciseId]);
      expect(groupSession.status).toBe('active');
      expect(groupSession.requirements.minAge).toBe(25);
    });
  });
});