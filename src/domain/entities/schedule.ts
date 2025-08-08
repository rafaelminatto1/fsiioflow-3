export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  therapistId: string;
  roomId?: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'double_booking' | 'room_conflict' | 'therapist_unavailable' | 'patient_preference';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedAppointments: string[];
  suggestedResolution?: string;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'reschedule' | 'reassign_therapist' | 'change_room' | 'combine_sessions';
  priority: number;
  estimatedSavings: number;
  description: string;
  originalAppointmentId: string;
  suggestedChanges: {
    newTime?: Date;
    newTherapist?: string;
    newRoom?: string;
  };
}

export class ScheduleEntity {
  constructor(
    public id: string,
    public date: Date,
    public timeSlots: TimeSlot[],
    public conflicts: ScheduleConflict[] = [],
    public optimizationSuggestions: OptimizationSuggestion[] = []
  ) {}

  detectConflicts(): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    
    // Check for double bookings
    const therapistBookings = new Map<string, TimeSlot[]>();
    const roomBookings = new Map<string, TimeSlot[]>();
    
    this.timeSlots.forEach(slot => {
      if (!slot.isAvailable) {
        // Track therapist bookings
        if (!therapistBookings.has(slot.therapistId)) {
          therapistBookings.set(slot.therapistId, []);
        }
        therapistBookings.get(slot.therapistId)!.push(slot);
        
        // Track room bookings
        if (slot.roomId) {
          if (!roomBookings.has(slot.roomId)) {
            roomBookings.set(slot.roomId, []);
          }
          roomBookings.get(slot.roomId)!.push(slot);
        }
      }
    });
    
    // Check for therapist conflicts
    therapistBookings.forEach((slots, therapistId) => {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          if (this.slotsOverlap(slots[i], slots[j])) {
            conflicts.push({
              id: `therapist_conflict_${Date.now()}_${i}`,
              type: 'double_booking',
              severity: 'high',
              description: `Therapist ${therapistId} has overlapping appointments`,
              affectedAppointments: [slots[i].id, slots[j].id],
              suggestedResolution: 'Reschedule one appointment or assign different therapist'
            });
          }
        }
      }
    });
    
    // Check for room conflicts
    roomBookings.forEach((slots, roomId) => {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          if (this.slotsOverlap(slots[i], slots[j])) {
            conflicts.push({
              id: `room_conflict_${Date.now()}_${i}`,
              type: 'room_conflict',
              severity: 'medium',
              description: `Room ${roomId} has overlapping appointments`,
              affectedAppointments: [slots[i].id, slots[j].id],
              suggestedResolution: 'Assign different room or reschedule'
            });
          }
        }
      }
    });
    
    this.conflicts = conflicts;
    return conflicts;
  }
  
  private slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
  }
  
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Find gaps that could be filled
    const sortedSlots = this.timeSlots
      .filter(slot => !slot.isAvailable)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];
      const gap = next.startTime.getTime() - current.endTime.getTime();
      
      // If there's a gap of 30+ minutes, suggest optimization
      if (gap >= 30 * 60 * 1000) {
        suggestions.push({
          id: `gap_optimization_${i}`,
          type: 'reschedule',
          priority: Math.floor(gap / (60 * 1000)), // Priority based on gap size
          estimatedSavings: gap / (60 * 1000), // Savings in minutes
          description: `Fill ${Math.floor(gap / (60 * 1000))} minute gap between appointments`,
          originalAppointmentId: next.id,
          suggestedChanges: {
            newTime: new Date(current.endTime.getTime() + 15 * 60 * 1000) // 15 min buffer
          }
        });
      }
    }
    
    // Suggest combining compatible sessions
    const groupedByTherapist = new Map<string, TimeSlot[]>();
    sortedSlots.forEach(slot => {
      if (!groupedByTherapist.has(slot.therapistId)) {
        groupedByTherapist.set(slot.therapistId, []);
      }
      groupedByTherapist.get(slot.therapistId)!.push(slot);
    });
    
    groupedByTherapist.forEach((slots, therapistId) => {
      if (slots.length >= 2) {
        for (let i = 0; i < slots.length - 1; i++) {
          const current = slots[i];
          const next = slots[i + 1];
          const timeBetween = next.startTime.getTime() - current.endTime.getTime();
          
          // If sessions are close (within 15 minutes), suggest combining
          if (timeBetween <= 15 * 60 * 1000) {
            suggestions.push({
              id: `combine_${current.id}_${next.id}`,
              type: 'combine_sessions',
              priority: 8,
              estimatedSavings: 15, // 15 minutes saved
              description: `Combine adjacent sessions for therapist ${therapistId}`,
              originalAppointmentId: current.id,
              suggestedChanges: {
                newTime: current.startTime
              }
            });
          }
        }
      }
    });
    
    this.optimizationSuggestions = suggestions.sort((a, b) => b.priority - a.priority);
    return this.optimizationSuggestions;
  }
  
  calculateEfficiencyScore(): number {
    const totalSlots = this.timeSlots.length;
    const bookedSlots = this.timeSlots.filter(slot => !slot.isAvailable).length;
    const conflictPenalty = this.conflicts.length * 10;
    const optimizationBonus = this.optimizationSuggestions.length * 5;
    
    const baseScore = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
    return Math.max(0, Math.min(100, baseScore - conflictPenalty + optimizationBonus));
  }
}