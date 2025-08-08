import { afterEach, beforeEach, expect, jest } from '@jest/globals';

// Setup global test environment
beforeEach(() => {
  // Mock crypto.randomUUID se não estiver disponível
  if (!global.crypto) {
    global.crypto = {
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    } as any;
  }

  // Mock console methods to reduce test noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Mock Date.now para testes consistentes se necessário
  const mockDate = new Date('2024-01-15T10:00:00Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
});

afterEach(() => {
  // Limpar todos os mocks após cada teste
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Extend Jest matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeRecentDate(received: Date, toleranceMs: number = 5000) {
    const now = new Date().getTime();
    const receivedTime = received.getTime();
    const diff = Math.abs(now - receivedTime);
    const pass = diff <= toleranceMs;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a recent date (within ${toleranceMs}ms)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a recent date (within ${toleranceMs}ms), but it was ${diff}ms ago`,
        pass: false,
      };
    }
  }
});

// Type augmentation for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeUUID(): R;
      toBeRecentDate(toleranceMs?: number): R;
    }
  }
}

// Helper functions for tests
export const createMockUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createMockDate = (offsetDays: number = 0): Date => {
  const baseDate = new Date('2024-01-15T10:00:00Z');
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate;
};

export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Common test data generators
export const generateMockPatientData = (overrides: any = {}) => {
  return {
    id: createMockUUID(),
    age: 35,
    gender: 'female',
    medicalConditions: ['lower_back_pain'],
    previousTherapyExperience: 0,
    initialPainLevel: 7,
    motivationScore: 8,
    sessionsAttended: 10,
    sessionsMissed: 2,
    lateArrivals: 1,
    earlyDepartures: 0,
    appUsageFrequency: 5,
    exerciseCompletionRate: 85,
    socialInteractions: 12,
    feedbackProvided: 8,
    startDate: createMockDate(-30),
    currentStreak: 5,
    longestStreak: 8,
    painImprovement: 40,
    functionalImprovement: 35,
    satisfactionScore: 8,
    groupSize: 6,
    groupCohesionScore: 7,
    peerSupportReceived: 10,
    ...overrides
  };
};

export const generateMockSessionData = (overrides: any = {}) => {
  return {
    completedExercises: 5,
    attended: true,
    averageFormScore: 7.5,
    helpedTeammates: 2,
    arrivedEarly: false,
    sessionDuration: 60,
    exerciseQuality: 7.0,
    ...overrides
  };
};

export const generateMockUserContext = (overrides: any = {}) => {
  return {
    isBeginner: false,
    isComeback: false,
    isGroupLeader: false,
    isMentor: false,
    currentStreak: 5,
    totalSessions: 10,
    improvementRate: 20,
    socialScore: 60,
    ...overrides
  };
};