import { UUID } from 'crypto';
import { RiskAssessment } from './ai-prediction-service';

export interface ClinicalInsight {
  id: UUID;
  type: 'adherence_trends' | 'group_dynamics' | 'exercise_effectiveness' | 'patient_progress' | 'resource_optimization';
  title: string;
  summary: string;
  impactScore: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'positive' | 'warning' | 'critical' | 'opportunity';
  data: Record<string, any>;
  recommendations: string[];
  affectedPatients?: UUID[];
  createdAt: Date;
  validUntil: Date;
  confidence: number; // 0-1
}

export interface ClinicData {
  adherenceRates: number[];
  patientSatisfaction: number[];
  groups: Array<{
    id: UUID;
    name: string;
    memberCount: number;
    adherenceRate: number;
    satisfactionScore: number;
    socialCohesionScore: number;
    averageProgress: number;
    retentionRate: number;
    performanceScore: number;
    strugglingMembers: number;
    recentAchievements: number;
  }>;
  exercises: Array<{
    id: UUID;
    name: string;
    category: string;
    usageFrequency: number;
    completionRate: number;
    satisfactionScore: number;
    effectivenessScore: number;
    difficultyRating: number;
  }>;
  resources: {
    fisioterapeutaUtilization: number;
    equipmentUsage: Record<string, number>;
    roomOccupancy: number;
    avgSessionDuration: number;
  };
  financialMetrics: {
    revenue: number[];
    costs: number[];
    profitMargin: number;
    patientLifetimeValue: number;
  };
}

export class ClinicalInsightsService {
  private readonly insightGenerators = {
    adherence_trends: this.analyzeAdherenceTrends.bind(this),
    group_dynamics: this.analyzeGroupDynamics.bind(this),
    exercise_effectiveness: this.analyzeExerciseEffectiveness.bind(this),
    patient_progress: this.analyzePatientProgress.bind(this),
    resource_optimization: this.analyzeResourceUsage.bind(this)
  };

  async generateWeeklyInsights(clinicData: ClinicData): Promise<ClinicalInsight[]> {
    const insights: ClinicalInsight[] = [];

    for (const [insightType, generator] of Object.entries(this.insightGenerators)) {
      try {
        const insight = await generator(clinicData);
        if (insight) {
          insights.push({
            ...insight,
            id: crypto.randomUUID() as UUID,
            createdAt: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Válido por 1 semana
          });
        }
      } catch (error) {
        console.error(`Error generating ${insightType}:`, error);
      }
    }

    // Priorizar insights por impacto e urgência
    return insights
      .sort((a, b) => {
        const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityScore[a.priority];
        const bPriority = priorityScore[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.impactScore - a.impactScore;
      })
      .slice(0, 10); // Top 10 insights
  }

  private async analyzeAdherenceTrends(clinicData: ClinicData): Promise<Omit<ClinicalInsight, 'id' | 'createdAt' | 'validUntil'> | null> {
    const adherenceData = clinicData.adherenceRates;
    
    if (adherenceData.length < 4) return null;

    const recentAvg = this.average(adherenceData.slice(-2));
    const previousAvg = this.average(adherenceData.slice(-4, -2));
    const trend = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (Math.abs(trend) < 5) return null; // Mudança insignificante

    const isPositiveTrend = trend > 0;
    const magnitude = Math.abs(trend);

    let category: 'positive' | 'warning' | 'critical' | 'opportunity';
    let priority: 'low' | 'medium' | 'high' | 'critical';

    if (isPositiveTrend) {
      category = magnitude > 15 ? 'positive' : 'opportunity';
      priority = magnitude > 15 ? 'high' : 'medium';
    } else {
      category = magnitude > 15 ? 'critical' : 'warning';
      priority = magnitude > 20 ? 'critical' : magnitude > 10 ? 'high' : 'medium';
    }

    const recommendations = isPositiveTrend 
      ? [
          'Identificar e documentar fatores que contribuíram para a melhoria',
          'Replicar estratégias bem-sucedidas para outros grupos',
          'Reconhecer e celebrar o progresso com a equipe',
          'Considerar expandir práticas eficazes'
        ]
      : [
          'Investigar causas específicas da queda na aderência',
          'Implementar intervenções direcionadas nos grupos com pior performance',
          'Revisar protocolos de acompanhamento e engajamento',
          'Considerar ajustes nos horários ou metodologia'
        ];

    return {
      type: 'adherence_trends',
      title: `Tendência de Aderência: ${isPositiveTrend ? 'Melhoria' : 'Declínio'} de ${magnitude.toFixed(1)}%`,
      summary: `A aderência ${isPositiveTrend ? 'aumentou' : 'diminuiu'} ${magnitude.toFixed(1)}% nas últimas duas semanas (${recentAvg.toFixed(1)}% vs ${previousAvg.toFixed(1)}%).`,
      impactScore: Math.min(100, magnitude * 3),
      priority,
      category,
      data: {
        trendDirection: isPositiveTrend ? 'increasing' : 'decreasing',
        trendMagnitude: magnitude,
        currentRate: recentAvg,
        previousRate: previousAvg,
        historicalData: adherenceData
      },
      recommendations,
      confidence: Math.min(0.9, 0.6 + (adherenceData.length / 20))
    };
  }

  private async analyzeGroupDynamics(clinicData: ClinicData): Promise<Omit<ClinicalInsight, 'id' | 'createdAt' | 'validUntil'> | null> {
    const groups = clinicData.groups;
    if (groups.length === 0) return null;

    const avgPerformance = this.average(groups.map(g => g.performanceScore));
    const highPerformingGroups = groups.filter(g => g.performanceScore > 8.0);
    const strugglingGroups = groups.filter(g => g.performanceScore < 6.0);

    if (highPerformingGroups.length === 0 && strugglingGroups.length === 0) return null;

    let category: 'positive' | 'warning' | 'critical' | 'opportunity' = 'opportunity';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (strugglingGroups.length > groups.length * 0.3) {
      category = 'critical';
      priority = 'high';
    } else if (highPerformingGroups.length > groups.length * 0.5) {
      category = 'positive';
      priority = 'medium';
    }

    const successFactors = this.identifySuccessFactors(highPerformingGroups);
    const problemAreas = this.identifyProblemAreas(strugglingGroups);

    const recommendations = [
      ...successFactors.map(factor => `Replicar estratégia: ${factor}`),
      ...problemAreas.map(problem => `Atenção especial: ${problem}`),
      'Facilitar troca de experiências entre fisioterapeutas',
      'Implementar mentoria entre grupos de alto e baixo desempenho'
    ];

    return {
      type: 'group_dynamics',
      title: `Análise de Grupos: ${highPerformingGroups.length} excelentes, ${strugglingGroups.length} precisando atenção`,
      summary: `Performance média dos grupos: ${avgPerformance.toFixed(1)}/10. ${highPerformingGroups.length} grupos com excelente performance, ${strugglingGroups.length} precisando intervenção.`,
      impactScore: strugglingGroups.length * 15 + highPerformingGroups.length * 10,
      priority,
      category,
      data: {
        averagePerformance: avgPerformance,
        highPerformingGroups: highPerformingGroups.map(g => ({
          name: g.name,
          score: g.performanceScore,
          successFactors: this.getGroupSuccessFactors(g)
        })),
        strugglingGroups: strugglingGroups.map(g => ({
          name: g.name,
          score: g.performanceScore,
          issues: this.getGroupIssues(g),
          memberCount: g.memberCount
        }))
      },
      recommendations,
      affectedPatients: strugglingGroups.flatMap(() => []), // Seria populado com IDs reais
      confidence: 0.85
    };
  }

  private async analyzeExerciseEffectiveness(clinicData: ClinicData): Promise<Omit<ClinicalInsight, 'id' | 'createdAt' | 'validUntil'> | null> {
    const exercises = clinicData.exercises;
    if (exercises.length === 0) return null;

    // Identificar exercícios mais e menos eficazes
    const sortedByEffectiveness = [...exercises].sort((a, b) => b.effectivenessScore - a.effectivenessScore);
    const topPerformers = sortedByEffectiveness.slice(0, Math.min(3, exercises.length));
    const underPerformers = sortedByEffectiveness.slice(-Math.min(3, exercises.length));

    const avgEffectiveness = this.average(exercises.map(e => e.effectivenessScore));
    const significantGap = topPerformers[0].effectivenessScore - underPerformers[underPerformers.length - 1].effectivenessScore;

    if (significantGap < 2.0) return null; // Gap insignificante

    const recommendations = [
      `Aumentar uso dos exercícios mais eficazes: ${topPerformers.map(e => e.name).join(', ')}`,
      `Revisar ou substituir exercícios menos eficazes: ${underPerformers.map(e => e.name).join(', ')}`,
      'Treinar equipe nas técnicas dos exercícios de maior sucesso',
      'Investigar fatores que tornam certos exercícios mais eficazes',
      'Considerar personalizar seleção de exercícios baseada na efetividade individual'
    ];

    return {
      type: 'exercise_effectiveness',
      title: `Efetividade dos Exercícios: Diferença significativa identificada`,
      summary: `Gap de ${significantGap.toFixed(1)} pontos entre exercícios mais e menos eficazes. Média geral: ${avgEffectiveness.toFixed(1)}/10.`,
      impactScore: Math.min(100, significantGap * 15),
      priority: significantGap > 3.0 ? 'high' : 'medium',
      category: 'opportunity',
      data: {
        averageEffectiveness: avgEffectiveness,
        topPerformers: topPerformers.map(e => ({
          name: e.name,
          category: e.category,
          effectivenessScore: e.effectivenessScore,
          usageFrequency: e.usageFrequency,
          completionRate: e.completionRate
        })),
        underPerformers: underPerformers.map(e => ({
          name: e.name,
          category: e.category,
          effectivenessScore: e.effectivenessScore,
          usageFrequency: e.usageFrequency,
          completionRate: e.completionRate
        })),
        effectivenessGap: significantGap
      },
      recommendations,
      confidence: 0.8
    };
  }

  private async analyzePatientProgress(clinicData: ClinicData): Promise<Omit<ClinicalInsight, 'id' | 'createdAt' | 'validUntil'> | null> {
    // Análise baseada na satisfação dos pacientes e progresso médio
    const satisfactionData = clinicData.patientSatisfaction;
    if (satisfactionData.length < 2) return null;

    const currentSatisfaction = this.average(satisfactionData.slice(-1));
    const previousSatisfaction = satisfactionData.length > 1 
      ? this.average(satisfactionData.slice(-2, -1)) 
      : currentSatisfaction;

    const satisfactionTrend = currentSatisfaction - previousSatisfaction;
    const avgGroupProgress = this.average(clinicData.groups.map(g => g.averageProgress));

    let category: 'positive' | 'warning' | 'critical' | 'opportunity';
    let priority: 'low' | 'medium' | 'high' | 'critical';

    if (currentSatisfaction < 6.0 || avgGroupProgress < 50) {
      category = 'critical';
      priority = 'high';
    } else if (satisfactionTrend < -1.0 || avgGroupProgress < 70) {
      category = 'warning';
      priority = 'medium';
    } else if (satisfactionTrend > 1.0 && avgGroupProgress > 80) {
      category = 'positive';
      priority = 'medium';
    } else {
      category = 'opportunity';
      priority = 'low';
    }

    const recommendations = category === 'positive' 
      ? [
          'Documentar práticas que estão gerando alta satisfação',
          'Usar casos de sucesso como exemplos para motivar outros pacientes',
          'Considerar expandir abordagens bem-sucedidas'
        ]
      : [
          'Implementar pesquisa detalhada de satisfação para identificar pontos de melhoria',
          'Revisar planos de tratamento dos grupos com menor progresso',
          'Aumentar frequência de feedback personalizado',
          'Considerar ajustes na metodologia ou intensidade dos exercícios'
        ];

    return {
      type: 'patient_progress',
      title: `Progresso dos Pacientes: Satisfação ${currentSatisfaction.toFixed(1)}/10`,
      summary: `Satisfação atual: ${currentSatisfaction.toFixed(1)}/10 (${satisfactionTrend > 0 ? '+' : ''}${satisfactionTrend.toFixed(1)}). Progresso médio dos grupos: ${avgGroupProgress.toFixed(1)}%.`,
      impactScore: Math.abs(satisfactionTrend) * 20 + (10 - currentSatisfaction) * 10,
      priority,
      category,
      data: {
        currentSatisfaction,
        satisfactionTrend,
        averageGroupProgress: avgGroupProgress,
        satisfactionHistory: satisfactionData,
        progressDistribution: clinicData.groups.map(g => ({
          groupName: g.name,
          progress: g.averageProgress,
          satisfaction: g.satisfactionScore
        }))
      },
      recommendations,
      confidence: 0.75
    };
  }

  private async analyzeResourceUsage(clinicData: ClinicData): Promise<Omit<ClinicalInsight, 'id' | 'createdAt' | 'validUntil'> | null> {
    const resources = clinicData.resources;
    const financials = clinicData.financialMetrics;

    const utilizationIssues: string[] = [];
    const opportunities: string[] = [];

    // Analisar utilização de fisioterapeutas
    if (resources.fisioterapeutaUtilization < 0.7) {
      utilizationIssues.push('Baixa utilização de fisioterapeutas (menos de 70%)');
    } else if (resources.fisioterapeutaUtilization > 0.9) {
      utilizationIssues.push('Sobrecarga de fisioterapeutas (mais de 90%)');
    }

    // Analisar ocupação das salas
    if (resources.roomOccupancy < 0.6) {
      opportunities.push('Salas subutilizadas - oportunidade para mais grupos');
    } else if (resources.roomOccupancy > 0.85) {
      utilizationIssues.push('Salas em uso máximo - possível gargalo');
    }

    // Analisar equipamentos
    const underutilizedEquipment = Object.entries(resources.equipmentUsage)
      .filter(([_, usage]) => usage < 0.3)
      .map(([equipment]) => equipment);

    if (underutilizedEquipment.length > 0) {
      opportunities.push(`Equipamentos subutilizados: ${underutilizedEquipment.join(', ')}`);
    }

    if (utilizationIssues.length === 0 && opportunities.length === 0) return null;

    const recommendations = [
      ...utilizationIssues.map(issue => `Resolver: ${issue}`),
      ...opportunities.map(opp => `Oportunidade: ${opp}`),
      'Revisar agendamento para otimizar uso de recursos',
      'Considerar redistribuição de carga de trabalho',
      'Avaliar ROI de equipamentos e espaços'
    ];

    return {
      type: 'resource_optimization',
      title: `Otimização de Recursos: ${utilizationIssues.length} problemas, ${opportunities.length} oportunidades`,
      summary: `Utilização atual - Fisioterapeutas: ${(resources.fisioterapeutaUtilization * 100).toFixed(1)}%, Salas: ${(resources.roomOccupancy * 100).toFixed(1)}%. Margem de lucro: ${(financials.profitMargin * 100).toFixed(1)}%.`,
      impactScore: utilizationIssues.length * 15 + opportunities.length * 10,
      priority: utilizationIssues.length > 2 ? 'high' : 'medium',
      category: utilizationIssues.length > opportunities.length ? 'warning' : 'opportunity',
      data: {
        fisioterapeutaUtilization: resources.fisioterapeutaUtilization,
        roomOccupancy: resources.roomOccupancy,
        equipmentUsage: resources.equipmentUsage,
        avgSessionDuration: resources.avgSessionDuration,
        profitMargin: financials.profitMargin,
        utilizationIssues,
        opportunities
      },
      recommendations,
      confidence: 0.9
    };
  }

  // Métodos auxiliares
  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private identifySuccessFactors(groups: ClinicData['groups']): string[] {
    const factors: string[] = [];
    
    const avgCohesion = this.average(groups.map(g => g.socialCohesionScore));
    if (avgCohesion > 8) factors.push('Alta coesão social dos grupos');
    
    const avgSize = this.average(groups.map(g => g.memberCount));
    if (avgSize >= 6 && avgSize <= 8) factors.push('Tamanho ideal dos grupos (6-8 membros)');
    
    return factors;
  }

  private identifyProblemAreas(groups: ClinicData['groups']): string[] {
    const problems: string[] = [];
    
    const highStrugglingGroups = groups.filter(g => g.strugglingMembers > g.memberCount * 0.3);
    if (highStrugglingGroups.length > 0) {
      problems.push(`Grupos com muitos membros em dificuldade`);
    }
    
    const lowRetentionGroups = groups.filter(g => g.retentionRate < 0.8);
    if (lowRetentionGroups.length > 0) {
      problems.push('Baixa retenção de membros');
    }
    
    return problems;
  }

  private getGroupSuccessFactors(group: ClinicData['groups'][0]): string[] {
    const factors: string[] = [];
    
    if (group.socialCohesionScore > 8) factors.push('Excelente coesão social');
    if (group.adherenceRate > 90) factors.push('Alta aderência');
    if (group.satisfactionScore > 8.5) factors.push('Alta satisfação');
    if (group.averageProgress > 85) factors.push('Progresso excepcional');
    
    return factors;
  }

  private getGroupIssues(group: ClinicData['groups'][0]): string[] {
    const issues: string[] = [];
    
    if (group.adherenceRate < 70) issues.push('Baixa aderência');
    if (group.satisfactionScore < 6) issues.push('Baixa satisfação');
    if (group.socialCohesionScore < 5) issues.push('Problemas de coesão');
    if (group.strugglingMembers > group.memberCount * 0.4) issues.push('Muitos membros em dificuldade');
    
    return issues;
  }
}