import { CreateGroupSessionUseCase } from '../../../application/use-cases/create-group-session';
import { CreateGroupSessionDTO } from '../../../application/dto/group-session-dto';
import { GroupSessionRepository } from '../../../domain/repositories/group-session-repository';
import { GroupMatchingService } from '../../../domain/services/group-matching-service';
import { GroupSessionEntity } from '../../../domain/entities/group-session';
import { UUID } from 'crypto';

// Mocks
class MockGroupSessionRepository implements GroupSessionRepository {
  private groups: GroupSessionEntity[] = [];

  async create(groupSession: any): Promise<any> {
    this.groups.push(groupSession);
    return groupSession;
  }

  async getById(groupId: UUID): Promise<any> {
    return this.groups.find(g => g.id === groupId) || null;
  }

  async getByFisioterapeuta(fisioterapeutaId: UUID): Promise<any[]> {
    return this.groups.filter(g => g.fisioterapeutaId === fisioterapeutaId);
  }

  async getAll(): Promise<any[]> {
    return this.groups;
  }

  async update(groupSession: any): Promise<any> {
    const index = this.groups.findIndex(g => g.id === groupSession.id);
    if (index !== -1) {
      this.groups[index] = groupSession;
    }
    return groupSession;
  }

  async delete(groupId: UUID): Promise<boolean> {
    const initialLength = this.groups.length;
    this.groups = this.groups.filter(g => g.id !== groupId);
    return this.groups.length < initialLength;
  }

  async findByStatus(status: any): Promise<any[]> {
    return this.groups.filter(g => g.status === status);
  }

  async findWithAvailableSlots(): Promise<any[]> {
    return this.groups.filter(g => g.currentMembers.length < g.maxCapacity);
  }

  async findByPatient(patientId: UUID): Promise<any[]> {
    return this.groups.filter(g => g.currentMembers.includes(patientId));
  }

  async search(criteria: any): Promise<any[]> {
    return this.groups;
  }
}

class MockGroupMatchingService extends GroupMatchingService {
  constructor() {
    super({} as any); // Mock repository
  }

  async findCompatiblePatients(): Promise<any[]> {
    // Mock implementation - return empty array
    return [];
  }
}

describe('CreateGroupSessionUseCase', () => {
  let useCase: CreateGroupSessionUseCase;
  let mockRepository: MockGroupSessionRepository;
  let mockMatchingService: MockGroupMatchingService;

  const mockFisioId = crypto.randomUUID() as UUID;
  const mockExerciseId = crypto.randomUUID() as UUID;

  beforeEach(() => {
    mockRepository = new MockGroupSessionRepository();
    mockMatchingService = new MockGroupMatchingService();
    useCase = new CreateGroupSessionUseCase(mockRepository, mockMatchingService);
  });

  describe('execute', () => {
    it('should create group session successfully with valid data', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Pilates Iniciante',
        description: 'Grupo de pilates para iniciantes',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['monday', 'wednesday', 'friday'],
          time: '14:00',
          duration: 60
        },
        requirements: {
          minAge: 18,
          maxAge: 65,
          excludedConditions: ['acute_injury']
        }
      };

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
      expect(result.fisioterapeutaId).toBe(dto.fisioterapeutaId);
      expect(result.maxCapacity).toBe(dto.maxCapacity);
      expect(result.memberCount).toBe(0);
      expect(result.availableSlots).toBe(8);
      expect(result.status).toBe('active');
    });

    it('should throw error for invalid group name', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'AB', // Too short
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['monday'],
          time: '14:00',
          duration: 60
        },
        requirements: {}
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Group name must have at least 3 characters'
      );
    });

    it('should throw error for invalid capacity', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 1, // Too small
        exercises: [mockExerciseId],
        schedule: {
          days: ['monday'],
          time: '14:00',
          duration: 60
        },
        requirements: {}
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Group capacity must be between 2 and 15'
      );
    });

    it('should throw error for empty schedule days', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: [], // Empty days
          time: '14:00',
          duration: 60
        },
        requirements: {}
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Group must have at least one scheduled day'
      );
    });

    it('should throw error for invalid time format', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['monday'],
          time: '25:00', // Invalid time
          duration: 60
        },
        requirements: {}
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Invalid time format. Use HH:MM format'
      );
    });

    it('should throw error for invalid session duration', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['monday'],
          time: '14:00',
          duration: 20 // Too short
        },
        requirements: {}
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Session duration must be between 30 and 180 minutes'
      );
    });

    it('should throw error for invalid days', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['invalid_day'], // Invalid day
          time: '14:00',
          duration: 60
        },
        requirements: {}
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Invalid days: invalid_day'
      );
    });

    it('should throw error when min age is greater than max age', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['monday'],
          time: '14:00',
          duration: 60
        },
        requirements: {
          minAge: 50,
          maxAge: 30 // Less than minAge
        }
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Minimum age cannot be greater than maximum age'
      );
    });

    it('should accept valid days in different cases', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Valid Group Name',
        description: 'Valid description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 8,
        exercises: [mockExerciseId],
        schedule: {
          days: ['Monday', 'WEDNESDAY', 'friday'], // Mixed cases
          time: '14:00',
          duration: 60
        },
        requirements: {}
      };

      const result = await useCase.execute(dto);
      expect(result).toBeDefined();
      expect(result.schedule.days).toEqual(['Monday', 'WEDNESDAY', 'friday']);
    });

    it('should handle repository creation properly', async () => {
      const dto: CreateGroupSessionDTO = {
        name: 'Test Group',
        description: 'Test description',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 6,
        exercises: [mockExerciseId],
        schedule: {
          days: ['tuesday', 'thursday'],
          time: '16:00',
          duration: 45
        },
        requirements: {
          minAge: 25,
          maxAge: 45
        }
      };

      const result = await useCase.execute(dto);

      // Verify the group was actually saved to the repository
      const savedGroup = await mockRepository.getById(result.id);
      expect(savedGroup).toBeDefined();
      expect(savedGroup.name).toBe(dto.name);
    });

    it('should set correct timestamps', async () => {
      const beforeExecution = new Date();
      
      const dto: CreateGroupSessionDTO = {
        name: 'Timestamp Test Group',
        description: 'Testing timestamps',
        fisioterapeutaId: mockFisioId,
        maxCapacity: 5,
        exercises: [],
        schedule: {
          days: ['saturday'],
          time: '10:00',
          duration: 90
        },
        requirements: {}
      };

      const result = await useCase.execute(dto);
      const afterExecution = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
    });
  });
});