export interface Protocol {
  id: string;
  name: string;
  description: string;
  indications: string[];
  contraindications: string[];
  techniques: string[];
  exercises: string[];
  duration: string;
  frequency: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
}

export interface ProtocolSuggestion {
  protocol: Protocol;
  matchScore: number;
  reasoning: string;
}

export class BodyMapProtocolsService {
  private static protocols: Protocol[] = [
    {
      id: 'williams_flexion',
      name: 'Protocolo de Williams (Flexão)',
      description: 'Exercícios de flexão para dor lombar mecânica',
      indications: ['lombar', 'dor_cronica', 'limitacao_movimento'],
      contraindications: ['instabilidade', 'espondilolistese'],
      techniques: ['Alongamento de flexores do quadril', 'Fortalecimento de abdominais'],
      exercises: ['Joelho ao peito', 'Flexão de tronco', 'Inclinação pélvica'],
      duration: '6-8 semanas',
      frequency: '3x por semana',
      evidenceLevel: 'B',
    },
    {
      id: 'mckenzie',
      name: 'Método McKenzie',
      description: 'Exercícios de extensão para dor lombar com irradiação',
      indications: ['lombar', 'irradiacao', 'dor_aguda'],
      contraindications: ['estenose_espinhal', 'espondilolistese'],
      techniques: ['Extensão progressiva', 'Centralização da dor'],
      exercises: ['Extensão em decúbito ventral', 'Extensão em pé', 'Deslizamento lateral'],
      duration: '4-6 semanas',
      frequency: 'Várias vezes ao dia',
      evidenceLevel: 'A',
    },
    {
      id: 'core_strengthening',
      name: 'Fortalecimento do Core',
      description: 'Estabilização da musculatura profunda do tronco',
      indications: ['lombar', 'instabilidade', 'fraqueza_muscular'],
      contraindications: ['dor_aguda_severa'],
      techniques: ['Ativação do transverso abdominal', 'Controle motor'],
      exercises: ['Prancha', 'Bird dog', 'Dead bug', 'Ponte'],
      duration: '8-12 semanas',
      frequency: '4-5x por semana',
      evidenceLevel: 'A',
    },
    {
      id: 'cervical_mobilization',
      name: 'Mobilização Cervical',
      description: 'Técnicas manuais para disfunção cervical',
      indications: ['cervical', 'limitacao_movimento', 'dor_cronica'],
      contraindications: ['instabilidade', 'arteria_vertebral'],
      techniques: ['Mobilização articular', 'Pompage', 'Liberação miofascial'],
      exercises: ['Rotação cervical', 'Flexão lateral', 'Retração cervical'],
      duration: '4-6 semanas',
      frequency: '2-3x por semana',
      evidenceLevel: 'B',
    },
    {
      id: 'shoulder_impingement',
      name: 'Protocolo para Impacto do Ombro',
      description: 'Tratamento conservador para síndrome do impacto',
      indications: ['ombro', 'limitacao_movimento', 'dor_ao_movimento'],
      contraindications: ['ruptura_completa_manguito'],
      techniques: ['Mobilização glenoumeral', 'Fortalecimento excêntrico'],
      exercises: ['Codman', 'Fortalecimento manguito rotador', 'Estabilização escapular'],
      duration: '6-8 semanas',
      frequency: '3-4x por semana',
      evidenceLevel: 'A',
    },
    {
      id: 'knee_patellofemoral',
      name: 'Reabilitação Patelofemoral',
      description: 'Protocolo para síndrome da dor patelofemoral',
      indications: ['joelho', 'dor_ao_movimento', 'instabilidade'],
      contraindications: ['lesao_ligamentar_aguda'],
      techniques: ['Fortalecimento quadríceps', 'Correção biomecânica'],
      exercises: ['Agachamento parcial', 'Leg press', 'Fortalecimento glúteo médio'],
      duration: '8-12 semanas',
      frequency: '4-5x por semana',
      evidenceLevel: 'B',
    },
    {
      id: 'ankle_sprain',
      name: 'Reabilitação de Entorse de Tornozelo',
      description: 'Protocolo funcional para entorse de tornozelo',
      indications: ['tornozelo', 'instabilidade', 'fraqueza_muscular'],
      contraindications: ['fratura', 'lesao_ligamentar_completa'],
      techniques: ['Propriocepção', 'Fortalecimento funcional'],
      exercises: ['Apoio unipodal', 'Prancha de equilíbrio', 'Exercícios com elástico'],
      duration: '4-6 semanas',
      frequency: '5-7x por semana',
      evidenceLevel: 'A',
    },
  ];

  static getProtocolsForRegions(regionCodes: string[], symptoms: string[]): ProtocolSuggestion[] {
    const suggestions: ProtocolSuggestion[] = [];

    this.protocols.forEach(protocol => {
      let matchScore = 0;
      let reasoning = '';

      // Pontuação por região anatômica
      const anatomicalMatch = regionCodes.some(code => 
        protocol.indications.some(indication => 
          code.toLowerCase().includes(indication.toLowerCase())
        )
      );
      if (anatomicalMatch) {
        matchScore += 40;
        reasoning += 'Região anatômica compatível. ';
      }

      // Pontuação por sintomas
      const symptomMatches = symptoms.filter(symptom =>
        protocol.indications.some(indication =>
          symptom.toLowerCase().includes(indication.toLowerCase()) ||
          indication.toLowerCase().includes(symptom.toLowerCase())
        )
      );
      matchScore += symptomMatches.length * 15;
      if (symptomMatches.length > 0) {
        reasoning += `Sintomas compatíveis: ${symptomMatches.join(', ')}. `;
      }

      // Penalização por contraindicações
      const contraindications = symptoms.filter(symptom =>
        protocol.contraindications.some(contra =>
          symptom.toLowerCase().includes(contra.toLowerCase())
        )
      );
      matchScore -= contraindications.length * 30;
      if (contraindications.length > 0) {
        reasoning += `Atenção às contraindicações: ${contraindications.join(', ')}. `;
      }

      // Bonificação por nível de evidência
      const evidenceBonus = { A: 10, B: 5, C: 2, D: 0 };
      matchScore += evidenceBonus[protocol.evidenceLevel];

      if (matchScore > 20) {
        suggestions.push({
          protocol,
          matchScore,
          reasoning: reasoning.trim(),
        });
      }
    });

    return suggestions.sort((a, b) => b.matchScore - a.matchScore);
  }

  static getProtocolById(id: string): Protocol | null {
    return this.protocols.find(p => p.id === id) || null;
  }

  static getAllProtocols(): Protocol[] {
    return [...this.protocols];
  }

  static generateTreatmentPlan(
    regionCodes: string[],
    symptoms: string[],
    patientAge: number,
    chronicConditions: string[] = []
  ): {
    primaryProtocol: Protocol | null;
    secondaryProtocols: Protocol[];
    modifications: string[];
    timeline: string;
  } {
    const suggestions = this.getProtocolsForRegions(regionCodes, symptoms);
    const primaryProtocol = suggestions[0]?.protocol || null;
    const secondaryProtocols = suggestions.slice(1, 3).map(s => s.protocol);

    const modifications: string[] = [];

    // Modificações por idade
    if (patientAge > 65) {
      modifications.push('Reduzir intensidade inicial em 20-30%');
      modifications.push('Aumentar tempo de aquecimento');
      modifications.push('Monitorar sinais vitais durante exercícios');
    }

    if (patientAge < 18) {
      modifications.push('Adaptar exercícios para desenvolvimento motor');
      modifications.push('Incluir componente lúdico quando possível');
    }

    // Modificações por condições crônicas
    if (chronicConditions.includes('diabetes')) {
      modifications.push('Monitorar cicatrização e sensibilidade');
      modifications.push('Cuidado especial com extremidades');
    }

    if (chronicConditions.includes('hipertensao')) {
      modifications.push('Evitar exercícios isométricos prolongados');
      modifications.push('Monitorar pressão arterial');
    }

    // Timeline baseado na severidade
    const hasChronicPain = symptoms.includes('dor_cronica');
    const hasAcutePain = symptoms.includes('dor_aguda');
    
    let timeline = '6-8 semanas';
    if (hasChronicPain) {
      timeline = '8-12 semanas com reavaliações quinzenais';
    } else if (hasAcutePain) {
      timeline = '4-6 semanas com reavaliação semanal inicial';
    }

    return {
      primaryProtocol,
      secondaryProtocols,
      modifications,
      timeline,
    };
  }
}

export default BodyMapProtocolsService;
