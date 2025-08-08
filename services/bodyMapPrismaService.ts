// services/bodyMapPrismaService.ts - Enhanced Prisma-based body map service
import { PrismaClient, PainPoint, BodyPart, Side } from '@prisma/client';
import { BodyMapAnalytics, PainPattern, RiskFactor, ImprovementPrediction } from '../src/types/bodymap.types';

const prisma = new PrismaClient();

export class BodyMapPrismaService {
  // Obter pontos de dor por paciente e data
  static async getPainPoints(patientId: string, date?: Date): Promise<PainPoint[]> {
    const whereClause: any = { patientId };
    
    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      whereClause.createdAt = {
        gte: startOfDay,
        lt: endOfDay
      };
    }

    try {
      return await prisma.painPoint.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Erro ao buscar pontos de dor:', error);
      throw new Error('Erro ao carregar pontos de dor do banco de dados');
    }
  }

  // Obter histórico de pontos de dor
  static async getPainPointHistory(patientId: string, days: number = 30): Promise<PainPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      return await prisma.painPoint.findMany({
        where: {
          patientId,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de pontos de dor:', error);
      throw new Error('Erro ao carregar histórico de pontos de dor');
    }
  }

  // Criar novo ponto de dor
  static async createPainPoint(data: {
    patientId: string;
    x: number;
    y: number;
    intensity: number;
    bodyPart: BodyPart;
    side: Side;
    notes?: string;
  }): Promise<PainPoint> {
    // Validações
    this.validatePainPointData(data);

    try {
      return await prisma.painPoint.create({
        data: {
          patientId: data.patientId,
          x: data.x,
          y: data.y,
          intensity: data.intensity,
          bodyPart: data.bodyPart,
          side: data.side,
          notes: data.notes || null
        }
      });
    } catch (error) {
      console.error('Erro ao criar ponto de dor:', error);
      throw new Error('Erro ao salvar ponto de dor no banco de dados');
    }
  }

  // Atualizar ponto de dor
  static async updatePainPoint(id: string, updates: Partial<PainPoint>): Promise<PainPoint> {
    // Remover campos que não devem ser atualizados
    const { id: _, patientId, createdAt, ...validUpdates } = updates as any;

    // Validações se houver atualizações críticas
    if (validUpdates.x !== undefined || validUpdates.y !== undefined || validUpdates.intensity !== undefined) {
      this.validatePainPointData({
        patientId: 'temp', // não será usado na validação
        x: validUpdates.x ?? 0,
        y: validUpdates.y ?? 0,
        intensity: validUpdates.intensity ?? 0,
        bodyPart: validUpdates.bodyPart ?? 'head',
        side: validUpdates.side ?? 'FRONT'
      });
    }

    try {
      return await prisma.painPoint.update({
        where: { id },
        data: validUpdates
      });
    } catch (error) {
      console.error('Erro ao atualizar ponto de dor:', error);
      throw new Error('Erro ao atualizar ponto de dor no banco de dados');
    }
  }

  // Deletar ponto de dor
  static async deletePainPoint(id: string): Promise<void> {
    try {
      await prisma.painPoint.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erro ao deletar ponto de dor:', error);
      throw new Error('Erro ao deletar ponto de dor do banco de dados');
    }
  }

  // Obter analytics avançados
  static async getAnalytics(patientId: string): Promise<BodyMapAnalytics> {
    try {
      const painPoints = await this.getPainPointHistory(patientId, 90); // Últimos 90 dias
      
      if (painPoints.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Métricas básicas
      const totalPainPoints = painPoints.length;
      const averagePainIntensity = painPoints.reduce((sum, p) => sum + p.intensity, 0) / totalPainPoints;

      // Partes do corpo mais afetadas
      const mostAffectedBodyParts = this.calculateMostAffectedBodyParts(painPoints);

      // Tendência da dor
      const painTrend = this.calculatePainTrend(painPoints);

      // Média semanal
      const weeklyPainAverage = this.calculateWeeklyAverage(painPoints);

      // Comparação mensal
      const monthlyComparison = this.calculateMonthlyComparison(painPoints);

      // Padrões comuns
      const commonPainPatterns = this.identifyPainPatterns(painPoints);

      // Fatores de risco
      const riskFactors = this.assessRiskFactors(painPoints, averagePainIntensity);

      // Predição de melhora
      const improvementPrediction = this.predictImprovement(painPoints);

      return {
        totalPainPoints,
        averagePainIntensity: Math.round(averagePainIntensity * 10) / 10,
        mostAffectedBodyParts,
        painTrend,
        weeklyPainAverage,
        monthlyComparison,
        commonPainPatterns,
        recoveryTime: this.calculateAverageRecoveryTime(painPoints),
        sessionEffectiveness: this.calculateSessionEffectiveness(painPoints),
        riskFactors,
        improvementPrediction
      };
    } catch (error) {
      console.error('Erro ao calcular analytics:', error);
      throw new Error('Erro ao calcular analytics do mapa corporal');
    }
  }

  // Export para PDF
  static async exportToPDF(patientId: string, options?: {
    includeAnalytics?: boolean;
    includeTimeline?: boolean;
    dateRange?: { start: Date; end: Date };
  }): Promise<Blob> {
    try {
      const painPoints = options?.dateRange 
        ? await this.getPainPointsInRange(patientId, options.dateRange.start, options.dateRange.end)
        : await this.getPainPointHistory(patientId, 30);

      const analytics = options?.includeAnalytics 
        ? await this.getAnalytics(patientId)
        : null;

      // Aqui você integraria com html2pdf.js ou outro serviço de geração de PDF
      // Por enquanto, retornamos um blob vazio como placeholder
      return new Blob(['PDF content would be here'], { type: 'application/pdf' });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  // Métodos auxiliares privados
  private static validatePainPointData(data: {
    x: number;
    y: number;
    intensity: number;
    [key: string]: any;
  }): void {
    if (data.x < 0 || data.x > 100) {
      throw new Error('Coordenada X inválida. Deve estar entre 0 e 100.');
    }

    if (data.y < 0 || data.y > 100) {
      throw new Error('Coordenada Y inválida. Deve estar entre 0 e 100.');
    }

    if (data.intensity < 0 || data.intensity > 10) {
      throw new Error('Intensidade da dor deve estar entre 0 e 10.');
    }
  }

  private static getEmptyAnalytics(): BodyMapAnalytics {
    return {
      totalPainPoints: 0,
      averagePainIntensity: 0,
      mostAffectedBodyParts: [],
      painTrend: 'stable',
      weeklyPainAverage: [],
      monthlyComparison: {
        current: 0,
        previous: 0,
        change: 0,
        changePercentage: 0
      },
      commonPainPatterns: [],
      recoveryTime: 0,
      sessionEffectiveness: 0,
      riskFactors: [],
      improvementPrediction: {
        expectedDays: 0,
        confidence: 0,
        factors: [],
        recommendations: []
      }
    };
  }

  private static calculateMostAffectedBodyParts(points: PainPoint[]) {
    const bodyPartCounts = new Map<BodyPart, { count: number; totalIntensity: number }>();
    
    points.forEach(point => {
      const current = bodyPartCounts.get(point.bodyPart) || { count: 0, totalIntensity: 0 };
      bodyPartCounts.set(point.bodyPart, {
        count: current.count + 1,
        totalIntensity: current.totalIntensity + point.intensity
      });
    });

    return Array.from(bodyPartCounts.entries())
      .map(([bodyPart, data]) => ({
        bodyPart,
        count: data.count,
        avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static calculatePainTrend(points: PainPoint[]): 'improving' | 'worsening' | 'stable' {
    if (points.length < 4) return 'stable';

    const sortedPoints = points.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstHalf = sortedPoints.slice(0, Math.floor(sortedPoints.length / 2));
    const secondHalf = sortedPoints.slice(Math.floor(sortedPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, p) => sum + p.intensity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.intensity, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference < -0.5) return 'improving';
    if (difference > 0.5) return 'worsening';
    return 'stable';
  }

  private static calculateWeeklyAverage(points: PainPoint[]): number[] {
    const weeks: number[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekPoints = points.filter(p => {
        const pointDate = new Date(p.createdAt);
        return pointDate >= weekStart && pointDate < weekEnd;
      });

      const weekAvg = weekPoints.length > 0 
        ? weekPoints.reduce((sum, p) => sum + p.intensity, 0) / weekPoints.length 
        : 0;
      
      weeks.push(Math.round(weekAvg * 10) / 10);
    }

    return weeks;
  }

  private static calculateMonthlyComparison(points: PainPoint[]) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthPoints = points.filter(p => 
      new Date(p.createdAt) >= currentMonthStart
    );
    const previousMonthPoints = points.filter(p => {
      const date = new Date(p.createdAt);
      return date >= previousMonthStart && date < previousMonthEnd;
    });

    const current = currentMonthPoints.length > 0
      ? currentMonthPoints.reduce((sum, p) => sum + p.intensity, 0) / currentMonthPoints.length
      : 0;
    
    const previous = previousMonthPoints.length > 0
      ? previousMonthPoints.reduce((sum, p) => sum + p.intensity, 0) / previousMonthPoints.length
      : 0;

    const change = current - previous;
    const changePercentage = previous > 0 ? (change / previous) * 100 : 0;

    return {
      current: Math.round(current * 10) / 10,
      previous: Math.round(previous * 10) / 10,
      change: Math.round(change * 10) / 10,
      changePercentage: Math.round(changePercentage * 10) / 10
    };
  }

  private static identifyPainPatterns(points: PainPoint[]): PainPattern[] {
    const patterns: PainPattern[] = [];
    
    // Padrão: múltiplas regiões afetadas simultaneamente
    const bodyPartGroups = new Map<string, PainPoint[]>();
    points.forEach(point => {
      const dateKey = new Date(point.createdAt).toDateString();
      if (!bodyPartGroups.has(dateKey)) {
        bodyPartGroups.set(dateKey, []);
      }
      bodyPartGroups.get(dateKey)!.push(point);
    });

    // Identificar dias com múltiplas regiões
    const multipleRegionDays = Array.from(bodyPartGroups.entries())
      .filter(([_, dayPoints]) => {
        const uniqueBodyParts = new Set(dayPoints.map(p => p.bodyPart));
        return uniqueBodyParts.size >= 2;
      });

    if (multipleRegionDays.length >= 3) {
      const commonBodyParts = this.findMostCommonBodyParts(
        multipleRegionDays.flatMap(([_, points]) => points)
      );

      patterns.push({
        id: 'multiple_regions',
        name: 'Dor em Múltiplas Regiões',
        description: 'Paciente frequentemente apresenta dor em várias regiões simultaneamente',
        bodyParts: commonBodyParts.slice(0, 3),
        frequency: multipleRegionDays.length,
        averageIntensity: Math.round((multipleRegionDays
          .flatMap(([_, points]) => points)
          .reduce((sum, p) => sum + p.intensity, 0) / 
          multipleRegionDays.flatMap(([_, points]) => points).length) * 10) / 10,
        timePattern: 'random',
        duration: 7 // estimativa
      });
    }

    return patterns;
  }

  private static findMostCommonBodyParts(points: PainPoint[]): BodyPart[] {
    const counts = new Map<BodyPart, number>();
    points.forEach(point => {
      counts.set(point.bodyPart, (counts.get(point.bodyPart) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([bodyPart]) => bodyPart);
  }

  private static assessRiskFactors(points: PainPoint[], avgIntensity: number): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Intensidade alta persistente
    if (avgIntensity > 7) {
      factors.push({
        type: 'high_pain_increase',
        severity: 'high',
        description: 'Intensidade média da dor está muito alta (>7)',
        recommendation: 'Considere ajustar o plano de tratamento e medicação'
      });
    }

    // Muitas regiões afetadas
    const uniqueBodyParts = new Set(points.map(p => p.bodyPart));
    if (uniqueBodyParts.size >= 5) {
      factors.push({
        type: 'multiple_areas',
        severity: 'medium',
        description: 'Muitas regiões corporais afetadas simultaneamente',
        recommendation: 'Investigar possível causa sistêmica ou padrão compensatório'
      });
    }

    // Longa duração sem melhora
    const oldestPoint = points.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    
    if (oldestPoint) {
      const daysSinceFirst = Math.floor(
        (Date.now() - new Date(oldestPoint.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceFirst > 30 && avgIntensity > 5) {
        factors.push({
          type: 'long_duration',
          severity: 'medium',
          description: `Dor persistente por mais de ${daysSinceFirst} dias sem melhora significativa`,
          recommendation: 'Reavaliar estratégia terapêutica e considerar encaminhamento especializado'
        });
      }
    }

    return factors;
  }

  private static predictImprovement(points: PainPoint[]): ImprovementPrediction {
    if (points.length < 5) {
      return {
        expectedDays: 14,
        confidence: 20,
        factors: ['Dados insuficientes para predição precisa'],
        recommendations: ['Continue o tratamento e documente a evolução']
      };
    }

    const trend = this.calculatePainTrend(points);
    const avgIntensity = points.reduce((sum, p) => sum + p.intensity, 0) / points.length;

    let expectedDays = 21; // padrão
    let confidence = 50;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Ajustar baseado na tendência
    if (trend === 'improving') {
      expectedDays = 14;
      confidence = 75;
      factors.push('Tendência de melhora identificada');
      recommendations.push('Manter o protocolo atual de tratamento');
    } else if (trend === 'worsening') {
      expectedDays = 35;
      confidence = 40;
      factors.push('Tendência de piora detectada');
      recommendations.push('Revisar e ajustar o plano de tratamento');
    }

    // Ajustar baseado na intensidade
    if (avgIntensity < 4) {
      expectedDays *= 0.8;
      confidence += 15;
      factors.push('Intensidade de dor relativamente baixa');
    } else if (avgIntensity > 7) {
      expectedDays *= 1.5;
      confidence -= 20;
      factors.push('Intensidade de dor elevada');
      recommendations.push('Considerar intervenções adicionais para controle da dor');
    }

    return {
      expectedDays: Math.round(expectedDays),
      confidence: Math.max(10, Math.min(90, confidence)),
      factors,
      recommendations
    };
  }

  private static calculateAverageRecoveryTime(points: PainPoint[]): number {
    // Implementação simplificada
    // Na prática, integraria com dados de sessões e recuperação
    const trend = this.calculatePainTrend(points);
    
    if (trend === 'improving') return 18;
    if (trend === 'stable') return 25;
    return 35;
  }

  private static calculateSessionEffectiveness(points: PainPoint[]): number {
    // Implementação simplificada
    // Na prática, integraria com dados de sessões
    const trend = this.calculatePainTrend(points);
    
    if (trend === 'improving') return 85;
    if (trend === 'stable') return 65;
    return 45;
  }

  private static async getPainPointsInRange(patientId: string, start: Date, end: Date): Promise<PainPoint[]> {
    return await prisma.painPoint.findMany({
      where: {
        patientId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

// Singleton instance compatível com o sistema existente
export const bodyMapService = BodyMapPrismaService;