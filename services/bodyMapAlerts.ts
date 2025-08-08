import type { BodyMapRegion, RegionHistory } from '../lib/schema';

export interface SmartAlert {
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  regionCode?: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
}

export class BodyMapAlertsService {
  static analyzeRegions(regions: BodyMapRegion[], regionHistories: RegionHistory[]): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const now = new Date();

    // Alerta: Dor crônica (> 30 dias)
    regions.forEach(region => {
      const daysSinceOnset = Math.ceil((now.getTime() - new Date(region.onsetDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceOnset > 30 && region.isActive) {
        alerts.push({
          type: 'warning',
          title: 'Dor Crônica Identificada',
          message: `${region.regionName} apresenta sintomas há ${daysSinceOnset} dias. Considere reavaliação do protocolo.`,
          regionCode: region.regionCode,
          priority: 'high',
        });
      }
    });

    // Alerta: Sem melhora em múltiplas sessões
    regionHistories.forEach(history => {
      if (history.sessionsCount >= 5 && Number(history.averageIntensity) >= 7) {
        alerts.push({
          type: 'error',
          title: 'Sem Melhora Significativa',
          message: `${history.regionCode} mantém intensidade alta após ${history.sessionsCount} sessões (média ${Number(history.averageIntensity).toFixed(1)}).`,
          regionCode: history.regionCode,
          priority: 'high',
        });
      }
    });

    // Alerta: Recidiva
    regionHistories.forEach(history => {
      if (history.recurrences > 0) {
        alerts.push({
          type: 'warning',
          title: 'Recidiva Detectada',
          message: `${history.regionCode} apresentou ${history.recurrences} recidiva(s). Investigar fatores causais.`,
          regionCode: history.regionCode,
          priority: 'medium',
        });
      }
    });

    // Alerta: Dor se espalhando (irradiação para múltiplas regiões)
    const regionsWithIrradiation = regions.filter(r => r.irradiationTo && (r.irradiationTo as string[]).length > 2);
    if (regionsWithIrradiation.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Possível Espalhamento da Dor',
        message: `Detectada irradiação para múltiplas regiões. Avaliar padrões de compensação.`,
        priority: 'medium',
      });
    }

    // Alerta: Melhora significativa (positivo)
    regions.forEach(region => {
      if (region.isImproved && region.improvementPercentage && region.improvementPercentage >= 70) {
        alerts.push({
          type: 'success',
          title: 'Excelente Progresso',
          message: `${region.regionName} apresenta ${region.improvementPercentage}% de melhora. Considere progressão do protocolo.`,
          regionCode: region.regionCode,
          priority: 'low',
        });
      }
    });

    // Alerta: Alta intensidade inicial
    regions.forEach(region => {
      if (region.painIntensity >= 9) {
        alerts.push({
          type: 'error',
          title: 'Dor Severa',
          message: `${region.regionName} com intensidade ${region.painIntensity}/10. Considerar abordagem multimodal.`,
          regionCode: region.regionCode,
          priority: 'high',
        });
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  static generateRecommendations(alerts: SmartAlert[]): string[] {
    const recommendations: string[] = [];

    const chronicPainAlerts = alerts.filter(a => a.title.includes('Crônica'));
    if (chronicPainAlerts.length > 0) {
      recommendations.push('• Considerar reavaliação médica para dor crônica');
      recommendations.push('• Implementar técnicas de manejo da dor (mindfulness, relaxamento)');
    }

    const noImprovementAlerts = alerts.filter(a => a.title.includes('Sem Melhora'));
    if (noImprovementAlerts.length > 0) {
      recommendations.push('• Revisar protocolo atual e considerar mudança de abordagem');
      recommendations.push('• Avaliar fatores externos (ergonomia, atividades de vida diária)');
    }

    const recurrenceAlerts = alerts.filter(a => a.title.includes('Recidiva'));
    if (recurrenceAlerts.length > 0) {
      recommendations.push('• Intensificar programa de exercícios preventivos');
      recommendations.push('• Educação do paciente sobre fatores de risco');
    }

    const severePainAlerts = alerts.filter(a => a.title.includes('Severa'));
    if (severePainAlerts.length > 0) {
      recommendations.push('• Considerar modalidades analgésicas (TENS, crioterapia)');
      recommendations.push('• Avaliar necessidade de medicação para dor');
    }

    return recommendations;
  }
}

export default BodyMapAlertsService;
