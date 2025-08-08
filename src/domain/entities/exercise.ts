import { UUID } from 'crypto';

export interface Exercise {
  id: UUID;
  name: string;
  description: string;
  category: string;
  targetMuscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // em minutos
  repetitions?: number;
  sets?: number;
  restTime?: number; // em segundos
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  contraindications: string[];
  equipmentNeeded: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ExerciseEntity implements Exercise {
  constructor(
    public id: UUID,
    public name: string,
    public description: string,
    public category: string,
    public targetMuscleGroups: string[],
    public difficulty: 'beginner' | 'intermediate' | 'advanced',
    public duration: number,
    public repetitions: number | undefined,
    public sets: number | undefined,
    public restTime: number | undefined,
    public instructions: string[],
    public videoUrl: string | undefined,
    public imageUrl: string | undefined,
    public contraindications: string[],
    public equipmentNeeded: string[],
    public tags: string[],
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  isContraindicatedFor(conditions: string[]): boolean {
    return this.contraindications.some(contraindication =>
      conditions.includes(contraindication)
    );
  }

  isSuitableForLevel(userLevel: 'beginner' | 'intermediate' | 'advanced'): boolean {
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    return levelOrder[this.difficulty] <= levelOrder[userLevel];
  }

  hasRequiredEquipment(availableEquipment: string[]): boolean {
    return this.equipmentNeeded.every(equipment =>
      availableEquipment.includes(equipment)
    );
  }

  matchesTags(searchTags: string[]): boolean {
    return searchTags.some(tag =>
      this.tags.some(exerciseTag =>
        exerciseTag.toLowerCase().includes(tag.toLowerCase())
      )
    );
  }

  updateInstructions(instructions: string[]): void {
    this.instructions = [...instructions];
    this.updatedAt = new Date();
  }

  addContraindication(condition: string): void {
    if (!this.contraindications.includes(condition)) {
      this.contraindications.push(condition);
      this.updatedAt = new Date();
    }
  }

  removeContraindication(condition: string): void {
    const index = this.contraindications.indexOf(condition);
    if (index > -1) {
      this.contraindications.splice(index, 1);
      this.updatedAt = new Date();
    }
  }
}