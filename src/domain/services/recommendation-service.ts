import { UUID } from 'crypto';
import { PatientData } from './ai-prediction-service';

export interface ExerciseRecommendation {
  exerciseId: UUID;
  name: string;
  category: string;
  recommendationScore: number;
  reasonCode: string;
  reason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  targetMuscleGroups: string[];
  adaptations?: string[];
  contraindications?: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface RecommendationContext {
  patientProfile: PatientProfile;
  recentExercises: UUID[];
  currentGoals: string[];
  availableEquipment: string[];
  sessionConstraints: {
    maxDuration: number;
    difficultyPreference?: 'beginner' | 'intermediate' | 'advanced';
    focusAreas?: string[];
  };
  groupContext?: {
    groupId: UUID;
    otherMembersConditions: string[];
    groupFitnessLevel: number;
  };
}

export interface PatientProfile {
  id: UUID;
  conditions: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  contraindications: string[];
  recentInjuries: string[];
  preferences: {
    exerciseTypes: string[];
    avoidedExercises: string[];
    preferredDuration: number;
    intensityPreference: number; // 1-10
  };
  progressHistory: {
    exerciseId: UUID;
    completionRate: number;
    avgDifficulty: number;
    lastPerformed: Date;
  }[];
}

export interface CollaborativeFilteringData {
  userId: UUID;
  exerciseId: UUID;
  rating: number; // 1-5 ou completion success rate
  completionTime: number;
  difficulty: number;
  satisfaction: number;
  timestamp: Date;
}

export class ExerciseRecommendationService {
  private contentBasedWeights = {
    conditionMatch: 0.3,
    goalAlignment: 0.25,
    fitnessLevel: 0.2,
    recentPerformance: 0.15,
    equipmentAvailability: 0.1
  };

  private exerciseDatabase: ExerciseData[] = []; // Seria carregado do banco

  constructor() {
    this.initializeExerciseDatabase();
  }

  private initializeExerciseDatabase(): void {
    // Simulação de base de exercícios - em produção viria do banco
    this.exerciseDatabase = [
      {
        id: crypto.randomUUID() as UUID,
        name: 'Fortalecimento do Core',
        category: 'core_strengthening',
        targetConditions: ['lower_back_pain', 'posture_issues'],
        targetMuscleGroups: ['abdominals', 'lower_back', 'hip_flexors'],
        difficulty: 'beginner',
        duration: 15,
        contraindications: ['acute_back_injury', 'herniated_disc'],
        equipmentNeeded: [],
        tags: ['stability', 'pain_relief', 'posture'],
        goalAlignment: ['pain_reduction', 'core_strength', 'posture_improvement']
      },
      {
        id: crypto.randomUUID() as UUID,
        name: 'Mobilidade de Quadril',
        category: 'mobility',
        targetConditions: ['hip_stiffness', 'lower_back_pain'],
        targetMuscleGroups: ['hip_flexors', 'glutes', 'piriformis'],
        difficulty: 'beginner',
        duration: 12,
        contraindications: ['acute_hip_injury'],
        equipmentNeeded: ['mat'],
        tags: ['flexibility', 'mobility', 'pain_relief'],
        goalAlignment: ['flexibility', 'pain_reduction', 'mobility']
      },
      {
        id: crypto.randomUUID() as UUID,
        name: 'Fortalecimento de Joelho',
        category: 'strengthening',
        targetConditions: ['knee_pain', 'patellar_tracking'],
        targetMuscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
        difficulty: 'intermediate',
        duration: 20,
        contraindications: ['acute_knee_injury', 'severe_arthritis'],
        equipmentNeeded: ['resistance_band'],
        tags: ['strengthening', 'stability', 'injury_prevention'],
        goalAlignment: ['strength', 'stability', 'injury_prevention']
      }
    ];
  }

  async recommendExercises(
    context: RecommendationContext,
    maxRecommendations: number = 10
  ): Promise<ExerciseRecommendation[]> {
    // Gerar recomendações baseadas em conteúdo
    const contentBasedRecs = await this.generateContentBasedRecommendations(context);
    
    // Aplicar filtros de segurança
    const safeRecommendations = this.applySafetyFilters(contentBasedRecs, context.patientProfile);
    
    // Aplicar diversificação
    const diversifiedRecs = this.diversifyRecommendations(safeRecommendations);
    
    // Aplicar constraints da sessão
    const constrainedRecs = this.applySessionConstraints(
      diversifiedRecs, 
      context.sessionConstraints
    );
    
    // Ordenar por score e retornar top N
    return constrainedRecs
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, maxRecommendations);
  }

  private async generateContentBasedRecommendations(
    context: RecommendationContext
  ): Promise<ExerciseRecommendation[]> {
    const recommendations: ExerciseRecommendation[] = [];
    
    for (const exercise of this.exerciseDatabase) {
      const score = this.calculateContentBasedScore(exercise, context);
      
      if (score.total > 0.3) { // Threshold mínimo
        recommendations.push({
          exerciseId: exercise.id,
          name: exercise.name,
          category: exercise.category,
          recommendationScore: score.total,
          reasonCode: score.primaryReason,
          reason: this.generateReasonText(score),
          difficulty: exercise.difficulty,
          estimatedDuration: exercise.duration,
          targetMuscleGroups: exercise.targetMuscleGroups,
          priority: score.total > 0.7 ? 'high' : score.total > 0.5 ? 'medium' : 'low'
        });
      }
    }
    
    return recommendations;
  }

  private calculateContentBasedScore(
    exercise: ExerciseData,
    context: RecommendationContext
  ): { total: number; factors: Record<string, number>; primaryReason: string } {
    const factors: Record<string, number> = {};
    
    // Score por condições médicas
    const conditionMatches = exercise.targetConditions.filter(condition =>
      context.patientProfile.conditions.includes(condition)
    ).length;
    factors.conditionMatch = conditionMatches / Math.max(exercise.targetConditions.length, 1);
    
    // Score por alinhamento com objetivos
    const goalMatches = exercise.goalAlignment.filter(goal =>
      context.patientProfile.goals.includes(goal)
    ).length;
    factors.goalAlignment = goalMatches / Math.max(exercise.goalAlignment.length, 1);
    
    // Score por nível de fitness
    const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
    const patientLevel = fitnessLevels.indexOf(context.patientProfile.fitnessLevel);
    const exerciseLevel = fitnessLevels.indexOf(exercise.difficulty);
    factors.fitnessLevel = 1 - Math.abs(patientLevel - exerciseLevel) / 2;
    
    // Score por performance recente
    const recentPerformance = context.patientProfile.progressHistory.find(
      p => p.exerciseId === exercise.id
    );
    factors.recentPerformance = recentPerformance 
      ? recentPerformance.completionRate 
      : 0.5; // Neutro para exercícios nunca feitos
    
    // Score por equipamento disponível
    const hasAllEquipment = exercise.equipmentNeeded.every(eq =>
      context.availableEquipment.includes(eq)
    );
    factors.equipmentAvailability = hasAllEquipment ? 1 : 0;
    
    // Calcular score total ponderado
    const total = Object.entries(this.contentBasedWeights).reduce(
      (sum, [factor, weight]) => sum + (factors[factor] || 0) * weight,
      0
    );
    
    // Determinar razão principal
    const primaryReason = Object.entries(factors).reduce(
      (max, [key, value]) => value > max.value ? { key, value } : max,
      { key: 'general', value: 0 }
    ).key;
    
    return { total, factors, primaryReason };
  }

  private applySafetyFilters(
    recommendations: ExerciseRecommendation[],
    patientProfile: PatientProfile
  ): ExerciseRecommendation[] {
    return recommendations.filter(rec => {
      const exercise = this.exerciseDatabase.find(ex => ex.id === rec.exerciseId);
      if (!exercise) return false;
      
      // Verificar contraindicações
      const hasContraindication = exercise.contraindications.some(contra =>
        patientProfile.contraindications.includes(contra) ||
        patientProfile.recentInjuries.includes(contra)
      );
      
      if (hasContraindication) return false;
      
      // Verificar exercícios evitados pelo paciente
      const isAvoided = patientProfile.preferences.avoidedExercises.some(avoided =>
        exercise.name.toLowerCase().includes(avoided.toLowerCase()) ||
        exercise.category === avoided
      );
      
      return !isAvoided;
    });
  }

  private diversifyRecommendations(
    recommendations: ExerciseRecommendation[]
  ): ExerciseRecommendation[] {
    const diversified: ExerciseRecommendation[] = [];
    const usedCategories = new Set<string>();
    
    // Primeiro, adicionar o melhor de cada categoria
    const sortedRecs = [...recommendations].sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    for (const rec of sortedRecs) {
      if (!usedCategories.has(rec.category)) {
        diversified.push(rec);
        usedCategories.add(rec.category);
      }
    }
    
    // Depois, adicionar outros exercícios mantendo diversidade
    for (const rec of sortedRecs) {
      if (!diversified.includes(rec) && diversified.length < 15) {
        diversified.push(rec);
      }
    }
    
    return diversified;
  }

  private applySessionConstraints(
    recommendations: ExerciseRecommendation[],
    constraints: RecommendationContext['sessionConstraints']
  ): ExerciseRecommendation[] {
    let filtered = [...recommendations];
    
    // Filtrar por duração máxima
    let totalDuration = 0;
    filtered = filtered.filter(rec => {
      if (totalDuration + rec.estimatedDuration <= constraints.maxDuration) {
        totalDuration += rec.estimatedDuration;
        return true;
      }
      return false;
    });
    
    // Filtrar por preferência de dificuldade
    if (constraints.difficultyPreference) {
      filtered = filtered.filter(rec => rec.difficulty === constraints.difficultyPreference);
    }
    
    // Filtrar por áreas de foco
    if (constraints.focusAreas && constraints.focusAreas.length > 0) {
      filtered = filtered.filter(rec =>
        rec.targetMuscleGroups.some(muscle =>
          constraints.focusAreas!.some(focus =>
            muscle.toLowerCase().includes(focus.toLowerCase())
          )
        )
      );
    }
    
    return filtered;
  }

  private generateReasonText(score: { factors: Record<string, number>; primaryReason: string }): string {
    const reasonTexts: Record<string, string> = {
      conditionMatch: 'Ideal para suas condições médicas',
      goalAlignment: 'Alinhado com seus objetivos',
      fitnessLevel: 'Adequado ao seu nível atual',
      recentPerformance: 'Baseado em seu progresso anterior',
      equipmentAvailability: 'Usa equipamentos disponíveis'
    };
    
    const primaryText = reasonTexts[score.primaryReason] || 'Recomendado para você';
    
    // Adicionar fatores secundários significativos
    const significantFactors = Object.entries(score.factors)
      .filter(([key, value]) => key !== score.primaryReason && value > 0.5)
      .map(([key]) => reasonTexts[key])
      .filter(text => text);
    
    if (significantFactors.length > 0) {
      return `${primaryText} e ${significantFactors.join(', ')}`;
    }
    
    return primaryText;
  }

  async generatePersonalizedProgram(
    patientId: UUID,
    programGoals: string[],
    durationWeeks: number,
    sessionsPerWeek: number
  ): Promise<{
    programId: UUID;
    phases: Array<{
      week: number;
      focus: string;
      exercises: ExerciseRecommendation[];
      progressionNotes: string;
    }>;
    expectedOutcomes: string[];
  }> {
    const programId = crypto.randomUUID() as UUID;
    const phases: Array<{
      week: number;
      focus: string;
      exercises: ExerciseRecommendation[];
      progressionNotes: string;
    }> = [];
    
    // Simular criação de programa progressivo
    const focusAreas = ['stability', 'mobility', 'strengthening', 'integration'];
    
    for (let week = 1; week <= durationWeeks; week++) {
      const focusIndex = Math.floor((week - 1) / Math.max(1, durationWeeks / focusAreas.length));
      const focus = focusAreas[Math.min(focusIndex, focusAreas.length - 1)];
      
      // Gerar exercícios para a semana
      const weeklyExercises: ExerciseRecommendation[] = [];
      // Lógica simplificada - em produção seria mais complexa
      
      phases.push({
        week,
        focus,
        exercises: weeklyExercises,
        progressionNotes: `Semana ${week}: Foco em ${focus}. Progressão baseada na resposta do paciente.`
      });
    }
    
    return {
      programId,
      phases,
      expectedOutcomes: [
        'Redução da dor em 30-50%',
        'Melhoria da mobilidade articular',
        'Fortalecimento da musculatura core',
        'Aumento da capacidade funcional'
      ]
    };
  }

  async trackExerciseOutcome(
    patientId: UUID,
    exerciseId: UUID,
    outcome: {
      completed: boolean;
      completionRate: number;
      difficulty: number;
      satisfaction: number;
      painLevel: number;
      duration: number;
      notes?: string;
    }
  ): Promise<void> {
    // Atualizar modelo colaborativo com novo feedback
    const feedbackData: CollaborativeFilteringData = {
      userId: patientId,
      exerciseId,
      rating: outcome.satisfaction,
      completionTime: outcome.duration,
      difficulty: outcome.difficulty,
      satisfaction: outcome.satisfaction,
      timestamp: new Date()
    };
    
    // Em produção, salvaria no banco e atualizaria modelo
    console.log('Exercise outcome tracked:', feedbackData);
  }
}

interface ExerciseData {
  id: UUID;
  name: string;
  category: string;
  targetConditions: string[];
  targetMuscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  contraindications: string[];
  equipmentNeeded: string[];
  tags: string[];
  goalAlignment: string[];
}