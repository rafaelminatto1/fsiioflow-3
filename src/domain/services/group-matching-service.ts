import { UUID } from 'crypto';
import { PatientRepository } from '../repositories/patient-repository';
import { Patient } from '../entities/patient';

function getAgeFromDate(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

export interface MatchingScore {
  patientId: UUID;
  compatibilityScore: number;
  factors: Record<string, number>;
  recommendationStrength: 'low' | 'medium' | 'high';
}

export interface GroupRequirements {
  minAge?: number;
  maxAge?: number;
  excludedConditions?: string[];
  fitnessLevel?: number;
}

export class GroupMatchingService {
  private readonly compatibilityWeights = {
    ageSimilarity: 0.15,
    conditionCompatibility: 0.25,
    fitnessLevel: 0.20,
    scheduleAvailability: 0.15,
    personalityMatch: 0.10,
    goalsAlignment: 0.15
  };

  constructor(private patientRepository: PatientRepository) {}

  async findCompatiblePatients(
    groupRequirements: GroupRequirements,
    excludePatients: UUID[] = []
  ): Promise<MatchingScore[]> {
    // Buscar pacientes elegíveis
    const eligiblePatients = await this.patientRepository.findEligibleForGroup(groupRequirements);
    
    // Filtrar pacientes já excluídos
    const filteredPatients = eligiblePatients.filter(patient => 
      !excludePatients.includes(patient.id)
    );

    // Calcular scores de compatibilidade
    const matchingScores: MatchingScore[] = filteredPatients.map(patient => {
      const score = this.calculateCompatibilityScore(patient, groupRequirements);
      return {
        patientId: patient.id,
        compatibilityScore: score.total,
        factors: score.factors,
        recommendationStrength: this.getRecommendationStrength(score.total)
      };
    });

    // Ordenar por score de compatibilidade
    return matchingScores
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 20); // Retornar top 20 matches
  }

  async findOptimalGroupComposition(
    availablePatients: Patient[],
    groupRequirements: GroupRequirements,
    maxGroupSize: number = 8
  ): Promise<UUID[]> {
    // Implementação simplificada do algoritmo de matching
    // Em produção, usaria algoritmo genético ou otimização mais sofisticada
    
    const compatibilityMatrix = this.calculateCompatibilityMatrix(availablePatients);
    const selectedPatients: UUID[] = [];
    
    // Greedy selection baseado em compatibilidade
    for (let i = 0; i < Math.min(availablePatients.length, maxGroupSize); i++) {
      let bestCandidate: UUID | null = null;
      let bestScore = -1;
      
      for (const patient of availablePatients) {
        if (selectedPatients.includes(patient.id)) continue;
        
        const score = this.calculateGroupFitScore(patient.id, selectedPatients, compatibilityMatrix);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = patient.id;
        }
      }
      
      if (bestCandidate) {
        selectedPatients.push(bestCandidate);
      }
    }
    
    return selectedPatients;
  }

  private calculateCompatibilityScore(patient: Patient, requirements: GroupRequirements): {
    total: number;
    factors: Record<string, number>;
  } {
    const factors: Record<string, number> = {};

    // Score baseado na idade (se há outros pacientes para comparar)
    factors.ageSimilarity = 0.8; // Score neutro por enquanto

    // Score baseado em condições médicas
    factors.conditionCompatibility = this.calculateConditionCompatibility(patient.medicalConditions, requirements);

    // Score baseado em nível de fitness (mockado por enquanto)
    factors.fitnessLevel = 0.7;

    // Score baseado em disponibilidade de horário (mockado)
    factors.scheduleAvailability = 0.8;

    // Score baseado em personalidade (mockado)
    factors.personalityMatch = 0.6;

    // Score baseado em alinhamento de objetivos (mockado)
    factors.goalsAlignment = 0.7;

    // Calcular score total ponderado
    const total = Object.entries(this.compatibilityWeights).reduce((sum, [factor, weight]) => {
      return sum + (factors[factor] || 0) * weight;
    }, 0);

    return { total, factors };
  }

  private calculateConditionCompatibility(patientConditions: string[], requirements: GroupRequirements): number {
    // Se há condições excludentes, verificar se o paciente as possui
    if (requirements.excludedConditions) {
      const hasExcludedCondition = patientConditions.some(condition =>
        requirements.excludedConditions!.includes(condition)
      );
      if (hasExcludedCondition) {
        return 0.0; // Incompatível
      }
    }

    // Score base para compatibilidade
    return 0.8;
  }

  private calculateCompatibilityMatrix(patients: Patient[]): number[][] {
    const n = patients.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const compatibility = this.calculatePairwiseCompatibility(patients[i], patients[j]);
        matrix[i][j] = compatibility;
        matrix[j][i] = compatibility;
      }
    }

    return matrix;
  }

  private calculatePairwiseCompatibility(patient1: Patient, patient2: Patient): number {
    let totalScore = 0.0;

    // Similaridade de idade
    const age1 = getAgeFromDate(patient1.birthDate);
    const age2 = getAgeFromDate(patient2.birthDate);
    const ageDiff = Math.abs(age1 - age2);
    const ageScore = Math.max(0, 1 - (ageDiff / 30)); // Normalizar por 30 anos
    totalScore += ageScore * this.compatibilityWeights.ageSimilarity;

    // Compatibilidade de condições
    const conditions1 = new Set(patient1.medicalConditions);
    const conditions2 = new Set(patient2.medicalConditions);

    // Verificar condições incompatíveis (exemplo)
    const incompatiblePairs = [
      ['acute_injury', 'chronic_pain'],
      ['post_surgery', 'high_intensity_training']
    ];

    const hasIncompatible = incompatiblePairs.some(([c1, c2]) =>
      (conditions1.has(c1) && conditions2.has(c2)) ||
      (conditions1.has(c2) && conditions2.has(c1))
    );

    let conditionScore = hasIncompatible ? 0.0 : 0.8;

    // Bonus por condições similares
    const commonConditions = [...conditions1].filter(c => conditions2.has(c));
    if (commonConditions.length > 0) {
      conditionScore += 0.2;
    }

    totalScore += conditionScore * this.compatibilityWeights.conditionCompatibility;

    // Outros fatores (mockados por simplicidade)
    totalScore += 0.7 * this.compatibilityWeights.fitnessLevel;
    totalScore += 0.8 * this.compatibilityWeights.scheduleAvailability;
    totalScore += 0.6 * this.compatibilityWeights.personalityMatch;
    totalScore += 0.7 * this.compatibilityWeights.goalsAlignment;

    return Math.min(totalScore, 1.0);
  }

  private calculateGroupFitScore(candidateId: UUID, currentGroup: UUID[], compatibilityMatrix: number[][]): number {
    if (currentGroup.length === 0) {
      return Math.random(); // Score aleatório para o primeiro membro
    }

    // Calcular score médio de compatibilidade com membros atuais
    // Simplificado: assumindo que temos índices dos pacientes
    return Math.random() * 0.8 + 0.2; // Mockado por simplicidade
  }

  private getRecommendationStrength(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }
}