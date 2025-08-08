import { UUID } from 'crypto';

export interface PatientData {
  id: UUID;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalConditions: string[];
  previousTherapyExperience: number; // em anos
  initialPainLevel: number; // 1-10
  motivationScore: number; // 1-10
  sessionsAttended: number;
  sessionsMissed: number;
  lateArrivals: number;
  earlyDepartures: number;
  appUsageFrequency: number; // vezes por semana
  exerciseCompletionRate: number; // %
  socialInteractions: number;
  feedbackProvided: number;
  startDate: Date;
  currentStreak: number;
  longestStreak: number;
  painImprovement: number; // %
  functionalImprovement: number; // %
  satisfactionScore: number; // 1-10
  groupSize: number;
  groupCohesionScore: number; // 1-10
  peerSupportReceived: number;
  adherenceRate?: number; // Para treinamento
}

export interface RiskAssessment {
  riskProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  riskClass: number; // 0 = boa aderência, 1 = risco de abandono
  recommendation: string;
  riskFactors: RiskFactor[];
  confidence: number; // 0-1
  interventions: Intervention[];
}

export interface RiskFactor {
  factor: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  impact: number; // 0-1
}

export interface Intervention {
  type: 'immediate_contact' | 'schedule_adjustment' | 'gamification_boost' | 'social_facilitation' | 'progress_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  responsible: 'fisioterapeuta' | 'recepção' | 'sistema' | 'coordenador';
  description: string;
  estimatedImpact: number; // 0-1
  timeToComplete: number; // em horas
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
  crossValidationScore: number;
  lastTrained: Date;
  sampleSize: number;
}

export class AdherencePredictionService {
  private model: any = null; // Em produção seria um modelo real (TensorFlow.js, etc)
  private modelMetrics: ModelMetrics | null = null;
  private featureWeights: Record<string, number> = {};
  private readonly FEATURE_NAMES = [
    'age', 'gender_female', 'medical_conditions_count',
    'chronic_pain', 'post_surgery', 'sports_injury',
    'previous_therapy_experience', 'initial_pain_level', 'motivation_score',
    'sessions_attended', 'sessions_missed', 'late_arrivals', 'early_departures',
    'app_usage_frequency', 'exercise_completion_rate', 'social_interactions',
    'feedback_provided', 'days_in_program', 'current_streak', 'longest_streak',
    'pain_improvement', 'functional_improvement', 'satisfaction_score',
    'group_size', 'group_cohesion_score', 'peer_support_received'
  ];

  constructor() {
    this.initializeDefaultWeights();
  }

  private initializeDefaultWeights(): void {
    // Pesos baseados em literatura científica e experiência clínica
    this.featureWeights = {
      'motivation_score': 0.15,
      'satisfaction_score': 0.12,
      'exercise_completion_rate': 0.11,
      'sessions_missed': -0.10,
      'pain_improvement': 0.09,
      'app_usage_frequency': 0.08,
      'current_streak': 0.07,
      'social_interactions': 0.06,
      'group_cohesion_score': 0.05,
      'functional_improvement': 0.05,
      'initial_pain_level': -0.04,
      'late_arrivals': -0.04,
      'age': -0.02,
      'peer_support_received': 0.03,
      'early_departures': -0.03
    };
  }

  prepareFeatures(patientData: PatientData): number[] {
    const features: number[] = [];

    // Features demográficas
    features.push(patientData.age);
    features.push(patientData.gender === 'female' ? 1 : 0);

    // Features médicas
    features.push(patientData.medicalConditions.length);
    features.push(patientData.medicalConditions.includes('chronic_pain') ? 1 : 0);
    features.push(patientData.medicalConditions.includes('post_surgery') ? 1 : 0);
    features.push(patientData.medicalConditions.includes('sports_injury') ? 1 : 0);

    // Features de histórico
    features.push(patientData.previousTherapyExperience);
    features.push(patientData.initialPainLevel);
    features.push(patientData.motivationScore);

    // Features comportamentais
    features.push(patientData.sessionsAttended);
    features.push(patientData.sessionsMissed);
    features.push(patientData.lateArrivals);
    features.push(patientData.earlyDepartures);

    // Features de engajamento
    features.push(patientData.appUsageFrequency);
    features.push(patientData.exerciseCompletionRate);
    features.push(patientData.socialInteractions);
    features.push(patientData.feedbackProvided);

    // Features temporais
    const daysInProgram = Math.floor((Date.now() - patientData.startDate.getTime()) / (1000 * 60 * 60 * 24));
    features.push(daysInProgram);
    features.push(patientData.currentStreak);
    features.push(patientData.longestStreak);

    // Features de progresso
    features.push(patientData.painImprovement);
    features.push(patientData.functionalImprovement);
    features.push(patientData.satisfactionScore);

    // Features de grupo
    features.push(patientData.groupSize);
    features.push(patientData.groupCohesionScore);
    features.push(patientData.peerSupportReceived);

    return features;
  }

  async predictAdherenceRisk(patientData: PatientData): Promise<RiskAssessment> {
    const features = this.prepareFeatures(patientData);
    
    // Implementação simplificada usando pesos das features
    // Em produção, usaria modelo treinado (Random Forest, XGBoost, etc.)
    let riskScore = 0.5; // Score base neutro
    
    // Aplicar pesos das features mais importantes
    const normalizedFeatures = this.normalizeFeatures(features, patientData);
    
    for (const [featureName, weight] of Object.entries(this.featureWeights)) {
      const featureIndex = this.FEATURE_NAMES.indexOf(featureName);
      if (featureIndex !== -1) {
        riskScore += normalizedFeatures[featureIndex] * weight;
      }
    }
    
    // Garantir que o score esteja entre 0 e 1
    riskScore = Math.max(0, Math.min(1, riskScore));
    
    // Determinar nível de risco
    let riskLevel: 'low' | 'medium' | 'high';
    let recommendation: string;
    
    if (riskScore > 0.7) {
      riskLevel = 'high';
      recommendation = 'Intervenção imediata necessária - risco alto de abandono';
    } else if (riskScore > 0.4) {
      riskLevel = 'medium';
      recommendation = 'Monitoramento próximo recomendado - risco moderado';
    } else {
      riskLevel = 'low';
      recommendation = 'Continuar acompanhamento regular - baixo risco';
    }
    
    // Identificar fatores de risco
    const riskFactors = this.identifyRiskFactors(patientData);
    
    // Gerar intervenções
    const interventions = this.generateInterventions(riskLevel, riskFactors, patientData);
    
    return {
      riskProbability: riskScore,
      riskLevel,
      riskClass: riskScore > 0.5 ? 1 : 0,
      recommendation,
      riskFactors,
      confidence: Math.max(0.6, 1 - Math.abs(riskScore - 0.5) * 2), // Mais confiante nos extremos
      interventions
    };
  }

  private normalizeFeatures(features: number[], patientData: PatientData): number[] {
    // Normalização simples - em produção usaria StandardScaler ou similar
    const normalized = [...features];
    
    // Normalizar algumas features específicas
    normalized[0] = patientData.age / 100; // Idade
    normalized[7] = patientData.initialPainLevel / 10; // Dor inicial
    normalized[8] = patientData.motivationScore / 10; // Motivação
    normalized[14] = patientData.exerciseCompletionRate / 100; // Taxa de conclusão
    normalized[21] = patientData.satisfactionScore / 10; // Satisfação
    
    return normalized;
  }

  private identifyRiskFactors(patientData: PatientData): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Analisar sessões perdidas
    if (patientData.sessionsMissed > 2) {
      riskFactors.push({
        factor: 'high_absence_rate',
        description: `${patientData.sessionsMissed} sessões perdidas`,
        severity: patientData.sessionsMissed > 5 ? 'high' : 'medium',
        suggestion: 'Conversar sobre barreiras para participação e ajustar horários',
        impact: Math.min(1, patientData.sessionsMissed / 10)
      });
    }

    // Analisar uso do app
    if (patientData.appUsageFrequency < 2) {
      riskFactors.push({
        factor: 'low_app_engagement',
        description: 'Baixo uso do aplicativo (menos de 2x por semana)',
        severity: 'medium',
        suggestion: 'Incentivar uso de funcionalidades gamificadas e lembretes',
        impact: 0.3
      });
    }

    // Analisar interações sociais
    if (patientData.socialInteractions < 1) {
      riskFactors.push({
        factor: 'social_isolation',
        description: 'Pouca ou nenhuma interação com o grupo',
        severity: 'medium',
        suggestion: 'Facilitar conexões sociais e apresentar a colegas compatíveis',
        impact: 0.25
      });
    }

    // Analisar progresso na dor
    if (patientData.painImprovement < 10) {
      riskFactors.push({
        factor: 'slow_pain_progress',
        description: `Melhoria da dor abaixo do esperado (${patientData.painImprovement}%)`,
        severity: 'high',
        suggestion: 'Revisar plano de tratamento e expectativas',
        impact: 0.4
      });
    }

    // Analisar satisfação
    if (patientData.satisfactionScore < 6) {
      riskFactors.push({
        factor: 'low_satisfaction',
        description: `Baixa satisfação (${patientData.satisfactionScore}/10)`,
        severity: 'high',
        suggestion: 'Reunião individual para entender insatisfações',
        impact: 0.35
      });
    }

    // Analisar motivação inicial
    if (patientData.motivationScore < 5) {
      riskFactors.push({
        factor: 'low_initial_motivation',
        description: `Baixa motivação inicial (${patientData.motivationScore}/10)`,
        severity: 'medium',
        suggestion: 'Trabalhar motivação intrínseca e definir metas pessoais',
        impact: 0.2
      });
    }

    // Analisar atrasos/saídas antecipadas
    if (patientData.lateArrivals > 3 || patientData.earlyDepartures > 3) {
      riskFactors.push({
        factor: 'schedule_conflicts',
        description: 'Problemas frequentes de pontualidade',
        severity: 'medium',
        suggestion: 'Revisar horários e identificar conflitos de agenda',
        impact: 0.15
      });
    }

    return riskFactors.sort((a, b) => b.impact - a.impact);
  }

  private generateInterventions(
    riskLevel: 'low' | 'medium' | 'high',
    riskFactors: RiskFactor[],
    patientData: PatientData
  ): Intervention[] {
    const interventions: Intervention[] = [];

    // Intervenções baseadas no nível de risco
    if (riskLevel === 'high') {
      interventions.push({
        type: 'immediate_contact',
        priority: 'urgent',
        action: 'Contato telefônico ou presencial nas próximas 24h',
        responsible: 'fisioterapeuta',
        description: 'Conversa individual para identificar barreiras específicas e renegociar objetivos',
        estimatedImpact: 0.6,
        timeToComplete: 1
      });
    }

    // Intervenções específicas por fator de risco
    for (const factor of riskFactors.slice(0, 3)) { // Top 3 fatores
      switch (factor.factor) {
        case 'high_absence_rate':
          interventions.push({
            type: 'schedule_adjustment',
            priority: 'high',
            action: 'Revisar disponibilidade e oferecer horários alternativos',
            responsible: 'recepção',
            description: 'Identificar conflitos de agenda e propor soluções flexíveis',
            estimatedImpact: 0.4,
            timeToComplete: 2
          });
          break;

        case 'low_app_engagement':
          interventions.push({
            type: 'gamification_boost',
            priority: 'medium',
            action: 'Ativar desafios personalizados e notificações motivacionais',
            responsible: 'sistema',
            description: 'Configurar desafios mais fáceis para gerar momentum inicial',
            estimatedImpact: 0.3,
            timeToComplete: 0.5
          });
          break;

        case 'social_isolation':
          interventions.push({
            type: 'social_facilitation',
            priority: 'medium',
            action: 'Apresentar a colegas compatíveis e facilitar interações',
            responsible: 'fisioterapeuta',
            description: 'Identificar membros com perfil similar e criar oportunidades de conexão',
            estimatedImpact: 0.35,
            timeToComplete: 1
          });
          break;

        case 'slow_pain_progress':
          interventions.push({
            type: 'progress_review',
            priority: 'high',
            action: 'Revisar plano de tratamento e expectativas',
            responsible: 'fisioterapeuta',
            description: 'Avaliar efetividade atual e ajustar abordagem terapêutica',
            estimatedImpact: 0.5,
            timeToComplete: 2
          });
          break;

        case 'low_satisfaction':
          interventions.push({
            type: 'immediate_contact',
            priority: 'high',
            action: 'Sessão de feedback detalhado sobre experiência',
            responsible: 'coordenador',
            description: 'Entender pontos de insatisfação e implementar melhorias',
            estimatedImpact: 0.45,
            timeToComplete: 1.5
          });
          break;
      }
    }

    // Ordenar por impacto estimado
    return interventions.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }

  async trainModel(trainingData: PatientData[]): Promise<ModelMetrics> {
    // Implementação simulada de treinamento
    console.log(`Training model with ${trainingData.length} samples...`);
    
    // Em produção, aqui seria feito o treinamento real
    const simulatedMetrics: ModelMetrics = {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.82 + Math.random() * 0.1,
      recall: 0.78 + Math.random() * 0.1,
      f1Score: 0.80 + Math.random() * 0.08,
      auc: 0.88 + Math.random() * 0.08,
      confusionMatrix: [
        [Math.floor(trainingData.length * 0.4), Math.floor(trainingData.length * 0.1)],
        [Math.floor(trainingData.length * 0.15), Math.floor(trainingData.length * 0.35)]
      ],
      featureImportance: this.featureWeights,
      crossValidationScore: 0.83 + Math.random() * 0.08,
      lastTrained: new Date(),
      sampleSize: trainingData.length
    };

    this.modelMetrics = simulatedMetrics;
    return simulatedMetrics;
  }

  getModelMetrics(): ModelMetrics | null {
    return this.modelMetrics;
  }

  async batchPredict(patients: PatientData[]): Promise<RiskAssessment[]> {
    const predictions: RiskAssessment[] = [];
    
    for (const patient of patients) {
      const assessment = await this.predictAdherenceRisk(patient);
      predictions.push(assessment);
    }
    
    return predictions;
  }

  generateInsights(predictions: RiskAssessment[]): {
    highRiskCount: number;
    averageRisk: number;
    commonRiskFactors: Array<{ factor: string; frequency: number }>;
    recommendedInterventions: Array<{ intervention: string; urgentCount: number }>;
  } {
    const highRiskCount = predictions.filter(p => p.riskLevel === 'high').length;
    const averageRisk = predictions.reduce((sum, p) => sum + p.riskProbability, 0) / predictions.length;
    
    // Analisar fatores de risco mais comuns
    const factorFrequency: Record<string, number> = {};
    const interventionUrgency: Record<string, number> = {};
    
    for (const prediction of predictions) {
      // Contar fatores de risco
      for (const factor of prediction.riskFactors) {
        factorFrequency[factor.factor] = (factorFrequency[factor.factor] || 0) + 1;
      }
      
      // Contar intervenções urgentes
      for (const intervention of prediction.interventions) {
        if (intervention.priority === 'urgent' || intervention.priority === 'high') {
          interventionUrgency[intervention.type] = (interventionUrgency[intervention.type] || 0) + 1;
        }
      }
    }
    
    const commonRiskFactors = Object.entries(factorFrequency)
      .map(([factor, frequency]) => ({ factor, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
    
    const recommendedInterventions = Object.entries(interventionUrgency)
      .map(([intervention, urgentCount]) => ({ intervention, urgentCount }))
      .sort((a, b) => b.urgentCount - a.urgentCount);
    
    return {
      highRiskCount,
      averageRisk,
      commonRiskFactors,
      recommendedInterventions
    };
  }
}