import { ScheduleEntity, OptimizationSuggestion, ScheduleConflict } from '../domain/entities/schedule';

export interface ScheduleOptimizationInput {
  scheduleId: string;
  date: Date;
  therapistPreferences?: {
    preferredStartTime?: Date;
    preferredEndTime?: Date;
    breakDuration?: number;
  };
  roomConstraints?: {
    availableRooms: string[];
    roomCapacity?: Map<string, number>;
  };
  patientPreferences?: {
    patientId: string;
    preferredTimes?: Date[];
    avoidTimes?: Date[];
  }[];
}

export interface ScheduleOptimizationOutput {
  originalSchedule: ScheduleEntity;
  optimizedSchedule: ScheduleEntity;
  appliedSuggestions: OptimizationSuggestion[];
  resolvedConflicts: ScheduleConflict[];
  efficiencyImprovement: number;
  estimatedTimeSaved: number;
  recommendations: string[];
}

export interface ScheduleRepository {
  findById(id: string): Promise<ScheduleEntity | null>;
  save(schedule: ScheduleEntity): Promise<void>;
  findByDateRange(startDate: Date, endDate: Date): Promise<ScheduleEntity[]>;
}

export interface TherapistRepository {
  findAvailableTherapists(date: Date, startTime: Date, endTime: Date): Promise<string[]>;
  getTherapistPreferences(therapistId: string): Promise<any>;
}

export interface RoomRepository {
  findAvailableRooms(date: Date, startTime: Date, endTime: Date): Promise<string[]>;
  getRoomCapacity(roomId: string): Promise<number>;
}

export class OptimizeScheduleUseCase {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private therapistRepository: TherapistRepository,
    private roomRepository: RoomRepository
  ) {}

  async execute(input: ScheduleOptimizationInput): Promise<ScheduleOptimizationOutput> {
    // Fetch original schedule
    const originalSchedule = await this.scheduleRepository.findById(input.scheduleId);
    if (!originalSchedule) {
      throw new Error(`Schedule with id ${input.scheduleId} not found`);
    }

    // Create a copy for optimization
    const optimizedSchedule = this.cloneSchedule(originalSchedule);

    // Step 1: Detect and resolve conflicts
    const conflicts = optimizedSchedule.detectConflicts();
    const resolvedConflicts: ScheduleConflict[] = [];

    for (const conflict of conflicts) {
      const resolved = await this.resolveConflict(conflict, optimizedSchedule, input);
      if (resolved) {
        resolvedConflicts.push(conflict);
      }
    }

    // Step 2: Apply optimization suggestions
    const suggestions = optimizedSchedule.generateOptimizationSuggestions();
    const appliedSuggestions: OptimizationSuggestion[] = [];

    for (const suggestion of suggestions) {
      const applied = await this.applySuggestion(suggestion, optimizedSchedule, input);
      if (applied) {
        appliedSuggestions.push(suggestion);
      }
    }

    // Step 3: Calculate improvements
    const originalEfficiency = originalSchedule.calculateEfficiencyScore();
    const optimizedEfficiency = optimizedSchedule.calculateEfficiencyScore();
    const efficiencyImprovement = optimizedEfficiency - originalEfficiency;

    const estimatedTimeSaved = appliedSuggestions.reduce(
      (total, suggestion) => total + suggestion.estimatedSavings,
      0
    );

    // Step 4: Generate recommendations
    const recommendations = this.generateRecommendations(
      originalSchedule,
      optimizedSchedule,
      appliedSuggestions
    );

    // Save optimized schedule
    await this.scheduleRepository.save(optimizedSchedule);

    return {
      originalSchedule,
      optimizedSchedule,
      appliedSuggestions,
      resolvedConflicts,
      efficiencyImprovement,
      estimatedTimeSaved,
      recommendations
    };
  }

  private cloneSchedule(schedule: ScheduleEntity): ScheduleEntity {
    return new ScheduleEntity(
      schedule.id,
      new Date(schedule.date),
      schedule.timeSlots.map(slot => ({ ...slot })),
      schedule.conflicts.map(conflict => ({ ...conflict })),
      schedule.optimizationSuggestions.map(suggestion => ({ ...suggestion }))
    );
  }

  private async resolveConflict(
    conflict: ScheduleConflict,
    schedule: ScheduleEntity,
    input: ScheduleOptimizationInput
  ): Promise<boolean> {
    switch (conflict.type) {
      case 'double_booking':
        return await this.resolveDoubleBooking(conflict, schedule, input);
      case 'room_conflict':
        return await this.resolveRoomConflict(conflict, schedule, input);
      case 'therapist_unavailable':
        return await this.resolveTherapistUnavailability(conflict, schedule, input);
      default:
        return false;
    }
  }

  private async resolveDoubleBooking(
    conflict: ScheduleConflict,
    schedule: ScheduleEntity,
    input: ScheduleOptimizationInput
  ): Promise<boolean> {
    const affectedSlots = schedule.timeSlots.filter(slot =>
      conflict.affectedAppointments.includes(slot.id)
    );

    if (affectedSlots.length < 2) return false;

    // Try to find alternative therapist for one of the appointments
    const firstSlot = affectedSlots[0];
    const availableTherapists = await this.therapistRepository.findAvailableTherapists(
      schedule.date,
      firstSlot.startTime,
      firstSlot.endTime
    );

    const alternativeTherapist = availableTherapists.find(t => t !== firstSlot.therapistId);
    if (alternativeTherapist) {
      firstSlot.therapistId = alternativeTherapist;
      return true;
    }

    // If no alternative therapist, try to reschedule
    const laterTime = new Date(firstSlot.endTime.getTime() + 30 * 60 * 1000);
    if (this.isTimeSlotAvailable(schedule, laterTime, firstSlot.therapistId)) {
      firstSlot.startTime = laterTime;
      firstSlot.endTime = new Date(laterTime.getTime() + 
        (firstSlot.endTime.getTime() - firstSlot.startTime.getTime()));
      return true;
    }

    return false;
  }

  private async resolveRoomConflict(
    conflict: ScheduleConflict,
    schedule: ScheduleEntity,
    input: ScheduleOptimizationInput
  ): Promise<boolean> {
    const affectedSlots = schedule.timeSlots.filter(slot =>
      conflict.affectedAppointments.includes(slot.id)
    );

    if (affectedSlots.length < 2) return false;

    const firstSlot = affectedSlots[0];
    const availableRooms = await this.roomRepository.findAvailableRooms(
      schedule.date,
      firstSlot.startTime,
      firstSlot.endTime
    );

    const alternativeRoom = availableRooms.find(r => r !== firstSlot.roomId);
    if (alternativeRoom) {
      firstSlot.roomId = alternativeRoom;
      return true;
    }

    return false;
  }

  private async resolveTherapistUnavailability(
    conflict: ScheduleConflict,
    schedule: ScheduleEntity,
    input: ScheduleOptimizationInput
  ): Promise<boolean> {
    // Implementation for therapist unavailability resolution
    return false;
  }

  private async applySuggestion(
    suggestion: OptimizationSuggestion,
    schedule: ScheduleEntity,
    input: ScheduleOptimizationInput
  ): Promise<boolean> {
    const targetSlot = schedule.timeSlots.find(slot => slot.id === suggestion.originalAppointmentId);
    if (!targetSlot) return false;

    switch (suggestion.type) {
      case 'reschedule':
        if (suggestion.suggestedChanges.newTime) {
          const newTime = suggestion.suggestedChanges.newTime;
          const duration = targetSlot.endTime.getTime() - targetSlot.startTime.getTime();
          
          if (this.isTimeSlotAvailable(schedule, newTime, targetSlot.therapistId)) {
            targetSlot.startTime = newTime;
            targetSlot.endTime = new Date(newTime.getTime() + duration);
            return true;
          }
        }
        break;

      case 'reassign_therapist':
        if (suggestion.suggestedChanges.newTherapist) {
          const availableTherapists = await this.therapistRepository.findAvailableTherapists(
            schedule.date,
            targetSlot.startTime,
            targetSlot.endTime
          );
          
          if (availableTherapists.includes(suggestion.suggestedChanges.newTherapist)) {
            targetSlot.therapistId = suggestion.suggestedChanges.newTherapist;
            return true;
          }
        }
        break;

      case 'change_room':
        if (suggestion.suggestedChanges.newRoom) {
          const availableRooms = await this.roomRepository.findAvailableRooms(
            schedule.date,
            targetSlot.startTime,
            targetSlot.endTime
          );
          
          if (availableRooms.includes(suggestion.suggestedChanges.newRoom)) {
            targetSlot.roomId = suggestion.suggestedChanges.newRoom;
            return true;
          }
        }
        break;

      case 'combine_sessions':
        // Implementation for combining sessions
        return this.combineSessions(suggestion, schedule);
    }

    return false;
  }

  private isTimeSlotAvailable(
    schedule: ScheduleEntity,
    startTime: Date,
    therapistId: string
  ): boolean {
    return !schedule.timeSlots.some(slot =>
      slot.therapistId === therapistId &&
      !slot.isAvailable &&
      slot.startTime < new Date(startTime.getTime() + 60 * 60 * 1000) &&
      startTime < slot.endTime
    );
  }

  private combineSessions(
    suggestion: OptimizationSuggestion,
    schedule: ScheduleEntity
  ): boolean {
    // Find sessions that can be combined
    // Implementation depends on specific business rules
    return false;
  }

  private generateRecommendations(
    original: ScheduleEntity,
    optimized: ScheduleEntity,
    appliedSuggestions: OptimizationSuggestion[]
  ): string[] {
    const recommendations: string[] = [];

    if (appliedSuggestions.length > 0) {
      recommendations.push(`Applied ${appliedSuggestions.length} optimization suggestions`);
    }

    const timeSaved = appliedSuggestions.reduce(
      (total, suggestion) => total + suggestion.estimatedSavings,
      0
    );

    if (timeSaved > 0) {
      recommendations.push(`Estimated ${timeSaved} minutes saved through optimization`);
    }

    if (optimized.conflicts.length < original.conflicts.length) {
      const resolvedCount = original.conflicts.length - optimized.conflicts.length;
      recommendations.push(`Resolved ${resolvedCount} scheduling conflicts`);
    }

    if (optimized.conflicts.length > 0) {
      recommendations.push(`${optimized.conflicts.length} conflicts remain and need manual attention`);
    }

    return recommendations;
  }
}