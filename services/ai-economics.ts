import { supabase } from '../lib/database';

export interface EconomicMetrics {
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  resourceUtilization: number;
  costPerSession: number;
  revenuePerPatient: number;
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface OptimizationOpportunity {
  id: string;
  type: 'schedule' | 'resource' | 'pricing' | 'capacity';
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number;
}

export interface ResourceUsage {
  roomOccupancy: Record<string, number>;
  equipmentUtilization: Record<string, number>;
  therapistWorkload: Record<string, number>;
  peakHours: string[];
  lowDemandPeriods: string[];
}

export interface DemandPrediction {
  date: string;
  predictedDemand: number;
  confidence: number;
  suggestedCapacity: number;
  revenueProjection: number;
}

export class AIEconomicsService {
  private readonly COST_FACTORS = {
    roomHourCost: 25, // R$ por hora
    equipmentDepreciation: 5, // R$ por uso
    therapistHourCost: 80, // R$ por hora
    utilityCost: 3, // R$ por sessão
    materialCost: 2 // R$ por sessão
  };

  async analyzeEconomicMetrics(clinicId: string, period: string = '30days'): Promise<EconomicMetrics> {
    const [appointments, costs, revenues] = await Promise.all([
      this.getAppointments(clinicId, period),
      this.getCosts(clinicId, period),
      this.getRevenues(clinicId, period)
    ]);

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
    const profitMargin = totalRevenue > 0 ? (totalRevenue - totalCosts) / totalRevenue : 0;

    const resourceUsage = await this.analyzeResourceUsage(clinicId, period);
    const resourceUtilization = this.calculateAverageUtilization(resourceUsage);

    const costPerSession = appointments.length > 0 ? totalCosts / appointments.length : 0;
    const uniquePatients = new Set(appointments.map(a => a.patientId)).size;
    const revenuePerPatient = uniquePatients > 0 ? totalRevenue / uniquePatients : 0;

    const optimizationOpportunities = await this.identifyOptimizationOpportunities(
      resourceUsage, 
      { totalRevenue, totalCosts, profitMargin, appointments }
    );

    return {
      totalRevenue,
      totalCosts,
      profitMargin,
      resourceUtilization,
      costPerSession,
      revenuePerPatient,
      optimizationOpportunities
    };
  }

  async predictDemand(clinicId: string, daysAhead: number = 30): Promise<DemandPrediction[]> {
    // Buscar dados históricos
    const historicalData = await this.getHistoricalDemand(clinicId, 90); // 90 dias de histórico
    
    const predictions: DemandPrediction[] = [];
    const today = new Date();

    for (let i = 1; i <= daysAhead; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const prediction = this.calculateDemandPrediction(historicalData, targetDate);
      predictions.push(prediction);
    }

    return predictions;
  }

  async optimizeScheduling(clinicId: string, date: string): Promise<{
    originalSchedule: any[];
    optimizedSchedule: any[];
    improvements: {
      roomUtilizationIncrease: number;
      revenueIncrease: number;
      costReduction: number;
    };
  }> {
    const appointments = await this.getAppointmentsByDate(clinicId, date);
    const resources = await this.getAvailableResources(clinicId, date);

    // Algoritmo de otimização simples
    const optimizedSchedule = this.optimizeAppointmentSchedule(appointments, resources);
    
    const improvements = this.calculateScheduleImprovements(appointments, optimizedSchedule);

    return {
      originalSchedule: appointments,
      optimizedSchedule,
      improvements
    };
  }

  async generateCostReport(clinicId: string, period: string): Promise<{
    breakdown: Record<string, number>;
    trends: Array<{ month: string; cost: number; revenue: number }>;
    recommendations: string[];
  }> {
    const costs = await this.getCosts(clinicId, period);
    const revenues = await this.getRevenues(clinicId, period);

    // Agrupar custos por categoria
    const breakdown = costs.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calcular tendências mensais
    const trends = this.calculateMonthlyTrends(costs, revenues);

    // Gerar recomendações baseadas na análise
    const recommendations = this.generateCostRecommendations(breakdown, trends);

    return { breakdown, trends, recommendations };
  }

  private async analyzeResourceUsage(clinicId: string, period: string): Promise<ResourceUsage> {
    const appointments = await this.getAppointments(clinicId, period);
    
    const roomOccupancy: Record<string, number> = {};
    const equipmentUtilization: Record<string, number> = {};
    const therapistWorkload: Record<string, number> = {};
    const hourlyDemand: Record<string, number> = {};

    appointments.forEach(appointment => {
      // Ocupação de salas
      if (appointment.roomId) {
        roomOccupancy[appointment.roomId] = (roomOccupancy[appointment.roomId] || 0) + 1;
      }

      // Utilização de equipamentos
      if (appointment.equipment) {
        appointment.equipment.forEach((eq: string) => {
          equipmentUtilization[eq] = (equipmentUtilization[eq] || 0) + 1;
        });
      }

      // Carga de trabalho dos fisioterapeutas
      if (appointment.therapistId) {
        therapistWorkload[appointment.therapistId] = (therapistWorkload[appointment.therapistId] || 0) + 1;
      }

      // Demanda por horário
      const hour = new Date(appointment.datetime).getHours();
      const hourKey = `${hour}:00`;
      hourlyDemand[hourKey] = (hourlyDemand[hourKey] || 0) + 1;
    });

    // Identificar horários de pico e baixa demanda
    const sortedHours = Object.entries(hourlyDemand).sort(([,a], [,b]) => b - a);
    const peakHours = sortedHours.slice(0, 3).map(([hour]) => hour);
    const lowDemandPeriods = sortedHours.slice(-3).map(([hour]) => hour);

    return {
      roomOccupancy,
      equipmentUtilization,
      therapistWorkload,
      peakHours,
      lowDemandPeriods
    };
  }

  private async identifyOptimizationOpportunities(
    resourceUsage: ResourceUsage,
    metrics: any
  ): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Oportunidade 1: Otimização de horários de baixa demanda
    if (resourceUsage.lowDemandPeriods.length > 0) {
      opportunities.push({
        id: 'low-demand-pricing',
        type: 'pricing',
        title: 'Preços promocionais em horários de baixa demanda',
        description: `Oferecer desconto de 15-20% nos horários: ${resourceUsage.lowDemandPeriods.join(', ')}`,
        potentialSavings: metrics.totalRevenue * 0.08,
        effort: 'low',
        impact: 'medium',
        priority: 8
      });
    }

    // Oportunidade 2: Melhor utilização de equipamentos
    const underutilizedEquipment = Object.entries(resourceUsage.equipmentUtilization)
      .filter(([, usage]) => usage < 50)
      .map(([equipment]) => equipment);

    if (underutilizedEquipment.length > 0) {
      opportunities.push({
        id: 'equipment-optimization',
        type: 'resource',
        title: 'Otimização de equipamentos subutilizados',
        description: `Equipamentos com baixa utilização: ${underutilizedEquipment.join(', ')}`,
        potentialSavings: underutilizedEquipment.length * 1000, // R$ 1000 por equipamento
        effort: 'medium',
        impact: 'medium',
        priority: 6
      });
    }

    // Oportunidade 3: Balanceamento de carga dos fisioterapeutas
    const workloadVariance = this.calculateWorkloadVariance(resourceUsage.therapistWorkload);
    if (workloadVariance > 0.3) {
      opportunities.push({
        id: 'workload-balancing',
        type: 'schedule',
        title: 'Balanceamento de carga entre fisioterapeutas',
        description: 'Redistribuir consultas para otimizar produtividade',
        potentialSavings: metrics.totalCosts * 0.12,
        effort: 'medium',
        impact: 'high',
        priority: 9
      });
    }

    // Oportunidade 4: Otimização de capacidade de salas
    const roomUtilization = Object.values(resourceUsage.roomOccupancy);
    const avgRoomUtilization = roomUtilization.reduce((a, b) => a + b, 0) / roomUtilization.length;
    
    if (avgRoomUtilization < 0.7) {
      opportunities.push({
        id: 'room-capacity',
        type: 'capacity',
        title: 'Aumento da ocupação das salas',
        description: `Ocupação média atual: ${(avgRoomUtilization * 100).toFixed(1)}%`,
        potentialSavings: metrics.totalRevenue * 0.15,
        effort: 'high',
        impact: 'high',
        priority: 7
      });
    }

    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  private calculateDemandPrediction(historicalData: any[], targetDate: Date): DemandPrediction {
    const dayOfWeek = targetDate.getDay();
    const month = targetDate.getMonth();
    
    // Filtrar dados similares (mesmo dia da semana, mesmo mês)
    const similarData = historicalData.filter(data => {
      const dataDate = new Date(data.date);
      return dataDate.getDay() === dayOfWeek || dataDate.getMonth() === month;
    });

    // Calcular média ponderada (dados mais recentes têm maior peso)
    let totalDemand = 0;
    let totalWeight = 0;
    
    similarData.forEach((data, index) => {
      const weight = Math.pow(0.9, similarData.length - index - 1); // Decaimento exponencial
      totalDemand += data.demand * weight;
      totalWeight += weight;
    });

    const predictedDemand = totalWeight > 0 ? totalDemand / totalWeight : 0;
    
    // Ajustar para sazonalidade
    const seasonalMultiplier = this.getSeasonalMultiplier(month);
    const adjustedDemand = Math.round(predictedDemand * seasonalMultiplier);

    // Calcular confiança baseada na quantidade de dados similares
    const confidence = Math.min(0.95, similarData.length / 10);

    // Sugerir capacidade (120% da demanda prevista para buffer)
    const suggestedCapacity = Math.ceil(adjustedDemand * 1.2);

    // Projeção de receita (média de R$ 120 por sessão)
    const revenueProjection = adjustedDemand * 120;

    return {
      date: targetDate.toISOString().split('T')[0],
      predictedDemand: adjustedDemand,
      confidence,
      suggestedCapacity,
      revenueProjection
    };
  }

  private calculateAverageUtilization(resourceUsage: ResourceUsage): number {
    const roomUtil = Object.values(resourceUsage.roomOccupancy);
    const equipUtil = Object.values(resourceUsage.equipmentUtilization);
    const therapistUtil = Object.values(resourceUsage.therapistWorkload);

    const allUtilizations = [...roomUtil, ...equipUtil, ...therapistUtil];
    return allUtilizations.length > 0 
      ? allUtilizations.reduce((a, b) => a + b, 0) / allUtilizations.length / 100
      : 0;
  }

  private calculateWorkloadVariance(workload: Record<string, number>): number {
    const values = Object.values(workload);
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coeficiente de variação
  }

  private getSeasonalMultiplier(month: number): number {
    // Multiplicadores sazonais baseados em padrões típicos de fisioterapia
    const multipliers = [
      0.85, // Jan - pós-feriados
      0.95, // Fev
      1.05, // Mar - volta às atividades
      1.10, // Abr
      1.00, // Mai
      0.90, // Jun - férias escolares
      0.80, // Jul - férias
      0.90, // Ago
      1.05, // Set - volta às aulas
      1.10, // Out
      1.00, // Nov
      0.75  // Dez - feriados
    ];
    
    return multipliers[month] || 1.0;
  }

  // Métodos auxiliares para buscar dados (mockados)
  private async getAppointments(clinicId: string, period: string) {
    // Mock data - em produção viria do Supabase
    return [
      { id: '1', patientId: 'p1', therapistId: 't1', roomId: 'r1', datetime: new Date(), equipment: ['eq1'] },
      { id: '2', patientId: 'p2', therapistId: 't1', roomId: 'r2', datetime: new Date(), equipment: ['eq2'] }
    ];
  }

  private async getCosts(clinicId: string, period: string) {
    return [
      { category: 'rent', amount: 5000 },
      { category: 'salaries', amount: 15000 },
      { category: 'equipment', amount: 2000 }
    ];
  }

  private async getRevenues(clinicId: string, period: string) {
    return [
      { amount: 12000 },
      { amount: 8000 },
      { amount: 10000 }
    ];
  }

  private async getHistoricalDemand(clinicId: string, days: number) {
    return [
      { date: '2024-01-01', demand: 15 },
      { date: '2024-01-08', demand: 18 },
      { date: '2024-01-15', demand: 12 }
    ];
  }

  private async getAppointmentsByDate(clinicId: string, date: string) {
    return [];
  }

  private async getAvailableResources(clinicId: string, date: string) {
    return { rooms: [], therapists: [], equipment: [] };
  }

  private optimizeAppointmentSchedule(appointments: any[], resources: any) {
    // Algoritmo de otimização simplificado
    return appointments;
  }

  private calculateScheduleImprovements(original: any[], optimized: any[]) {
    return {
      roomUtilizationIncrease: 0.15,
      revenueIncrease: 1200,
      costReduction: 800
    };
  }

  private calculateMonthlyTrends(costs: any[], revenues: any[]) {
    return [
      { month: 'Jan', cost: 20000, revenue: 25000 },
      { month: 'Fev', cost: 22000, revenue: 28000 },
      { month: 'Mar', cost: 21000, revenue: 30000 }
    ];
  }

  private generateCostRecommendations(breakdown: Record<string, number>, trends: any[]): string[] {
    const recommendations = [];
    
    // Análise de custos altos
    const totalCosts = Object.values(breakdown).reduce((a, b) => a + b, 0);
    Object.entries(breakdown).forEach(([category, cost]) => {
      const percentage = (cost / totalCosts) * 100;
      if (percentage > 40) {
        recommendations.push(`Atenção: ${category} representa ${percentage.toFixed(1)}% dos custos totais`);
      }
    });

    // Análise de tendências
    const lastMonth = trends[trends.length - 1];
    const previousMonth = trends[trends.length - 2];
    
    if (lastMonth && previousMonth) {
      const costIncrease = ((lastMonth.cost - previousMonth.cost) / previousMonth.cost) * 100;
      if (costIncrease > 10) {
        recommendations.push(`Custos aumentaram ${costIncrease.toFixed(1)}% no último mês - revisar operações`);
      }
    }

    return recommendations;
  }
}