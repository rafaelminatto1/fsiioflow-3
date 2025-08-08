import { UUID } from 'crypto';
import { CreateGroupSessionDTO, GroupSessionResponseDTO, mapGroupSessionToResponseDTO } from '../dto/group-session-dto';
import { GroupSession, GroupSessionEntity } from '../../domain/entities/group-session';
import { GroupSessionRepository } from '../../domain/repositories/group-session-repository';
import { GroupMatchingService } from '../../domain/services/group-matching-service';

export class CreateGroupSessionUseCase {
  constructor(
    private groupRepository: GroupSessionRepository,
    private matchingService: GroupMatchingService
  ) {}

  async execute(dto: CreateGroupSessionDTO): Promise<GroupSessionResponseDTO> {
    // Validar dados de entrada
    this.validateInput(dto);

    // Criar entidade do grupo
    const groupId = crypto.randomUUID() as UUID;
    const now = new Date();

    const group = new GroupSessionEntity(
      groupId,
      dto.name,
      dto.description,
      dto.fisioterapeutaId,
      dto.maxCapacity,
      [],
      dto.exercises,
      dto.schedule,
      'active',
      dto.requirements,
      now,
      now
    );

    // Salvar no repositório
    const createdGroup = await this.groupRepository.create(group);

    // Sugerir pacientes compatíveis (processo assíncrono)
    this.matchingService.findCompatiblePatients(dto.requirements)
      .catch(error => {
        console.error('Error finding compatible patients:', error);
      });

    return mapGroupSessionToResponseDTO(createdGroup);
  }

  private validateInput(dto: CreateGroupSessionDTO): void {
    if (!dto.name || dto.name.trim().length < 3) {
      throw new Error('Group name must have at least 3 characters');
    }

    if (dto.maxCapacity < 2 || dto.maxCapacity > 15) {
      throw new Error('Group capacity must be between 2 and 15');
    }

    if (!dto.schedule.days || dto.schedule.days.length === 0) {
      throw new Error('Group must have at least one scheduled day');
    }

    if (!dto.schedule.time || !dto.schedule.time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      throw new Error('Invalid time format. Use HH:MM format');
    }

    if (dto.schedule.duration < 30 || dto.schedule.duration > 180) {
      throw new Error('Session duration must be between 30 and 180 minutes');
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const invalidDays = dto.schedule.days.filter(day => !validDays.includes(day.toLowerCase()));
    if (invalidDays.length > 0) {
      throw new Error(`Invalid days: ${invalidDays.join(', ')}`);
    }

    if (dto.requirements.minAge && dto.requirements.maxAge && dto.requirements.minAge > dto.requirements.maxAge) {
      throw new Error('Minimum age cannot be greater than maximum age');
    }
  }
}