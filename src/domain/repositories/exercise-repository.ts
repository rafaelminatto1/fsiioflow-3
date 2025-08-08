import { UUID } from 'crypto';
import { Exercise } from '../entities/exercise';

export interface ExerciseRepository {
  create(exercise: Exercise): Promise<Exercise>;
  getById(exerciseId: UUID): Promise<Exercise | null>;
  getAll(): Promise<Exercise[]>;
  update(exercise: Exercise): Promise<Exercise>;
  delete(exerciseId: UUID): Promise<boolean>;
  findByCategory(category: string): Promise<Exercise[]>;
  findByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<Exercise[]>;
  findByMuscleGroups(muscleGroups: string[]): Promise<Exercise[]>;
  findSuitableForConditions(conditions: string[]): Promise<Exercise[]>;
  search(criteria: ExerciseSearchCriteria): Promise<Exercise[]>;
  findRecommendedFor(patientProfile: {
    conditions: string[];
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    availableEquipment: string[];
    goals: string[];
  }): Promise<Exercise[]>;
}

export interface ExerciseSearchCriteria {
  name?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetMuscleGroups?: string[];
  tags?: string[];
  durationRange?: {
    min?: number;
    max?: number;
  };
  equipmentNeeded?: string[];
  excludeContraindications?: string[];
  isActive?: boolean;
}