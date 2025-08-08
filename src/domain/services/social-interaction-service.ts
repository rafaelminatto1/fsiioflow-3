import { UUID } from 'crypto';
import { SocialInteraction } from '../entities/gamification';

export interface InteractionSuggestion {
  type: 'celebration' | 'encouragement' | 'help_offer' | 'question' | 'tip_sharing';
  targetUser?: UUID;
  messageTemplate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: Record<string, any>;
  estimatedPoints: number;
}

export interface GroupContext {
  groupId: UUID;
  recentAchievements: Array<{
    userId: UUID;
    userName: string;
    badgeName: string;
    achievedAt: Date;
  }>;
  strugglingMembers: Array<{
    userId: UUID;
    userName: string;
    issueType: 'attendance' | 'progress' | 'engagement';
    strugglingDays: number;
  }>;
  topPerformers: Array<{
    userId: UUID;
    userName: string;
    category: 'consistency' | 'improvement' | 'social' | 'leadership';
    score: number;
  }>;
  groupMorale: number;
  averageEngagement: number;
}

export class SocialInteractionService {
  private readonly interactionWeights = {
    encouragement: 2.0,
    help_request: 1.5,
    tip_sharing: 2.5,
    celebration: 1.0,
    question: 1.0,
    answer: 2.0,
    group_motivation: 1.8,
    progress_sharing: 1.6
  };

  private readonly messageTemplates = {
    celebration: [
      "Parabéns pela conquista: {achievement}! 🎉",
      "Que incrível, {userName}! Você conseguiu {achievement}! 👏",
      "Arrasou! {achievement} é uma conquista e tanto! 🌟",
      "Inspirador ver seu {achievement}! Continue assim! 💪"
    ],
    encouragement: [
      "Oi {userName}! Vi que você está enfrentando alguns desafios. Posso ajudar? 🤝",
      "Não desista, {userName}! Todo progresso começa com um primeiro passo! 💪",
      "Lembra que você já superou desafios antes, {userName}. Você consegue! 🌟",
      "Estou aqui se precisar conversar ou trocar dicas, {userName}! 😊"
    ],
    help_offer: [
      "Vi que você está com dificuldade em {exercise}. Posso compartilhar uma dica? 💡",
      "Que tal praticarmos {exercise} juntos na próxima sessão? 🤝",
      "Tenho uma técnica que me ajudou muito com {exercise}. Quer saber? 📚"
    ],
    tip_sharing: [
      "Pessoal, descobri uma técnica incrível para {exercise}! 💡",
      "Dica para quem está fazendo {exercise}: {tip} ✨",
      "O que tem funcionado pra mim em {exercise}: {tip} 🎯"
    ],
    motivation: [
      "Que energia incrível do grupo hoje! 🔥",
      "Amando ver o progresso de todo mundo! 📈",
      "Nossa equipe é demais! Cada um ajudando o outro! 🤝"
    ]
  };

  calculateSocialScore(interactions: SocialInteraction[], timeframeDays: number = 30): number {
    let totalScore = 0.0;
    const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

    // Filtrar interações dentro do período
    const recentInteractions = interactions.filter(i => i.createdAt >= cutoffDate);

    for (const interaction of recentInteractions) {
      const weight = this.interactionWeights[interaction.type as keyof typeof this.interactionWeights] || 1.0;
      
      // Multiplicador de qualidade baseado em engajamento
      const qualityMultiplier = 1.0 + (interaction.likes * 0.1) + (interaction.responses * 0.2);
      
      // Multiplicador de recência (interações mais recentes valem mais)
      const daysSince = Math.floor((Date.now() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const recencyMultiplier = Math.max(0.1, 1.0 - (daysSince * 0.05));
      
      // Multiplicador de reciprocidade (interações bidirecionais valem mais)
      const reciprocityMultiplier = interaction.targetUserId ? 1.2 : 1.0;
      
      const interactionScore = weight * qualityMultiplier * recencyMultiplier * reciprocityMultiplier;
      totalScore += interactionScore;
    }

    // Normalizar para escala 0-100
    return Math.min(totalScore, 100.0);
  }

  suggestInteractions(
    userId: UUID,
    groupContext: GroupContext,
    userInteractionHistory: SocialInteraction[]
  ): InteractionSuggestion[] {
    const suggestions: InteractionSuggestion[] = [];
    
    // Sugestões baseadas em conquistas recentes
    this.addCelebrationSuggestions(userId, groupContext.recentAchievements, suggestions);
    
    // Sugestões baseadas em membros com dificuldades
    this.addEncouragementSuggestions(userId, groupContext.strugglingMembers, suggestions);
    
    // Sugestões baseadas em top performers
    this.addLearningOpportunitySuggestions(userId, groupContext.topPerformers, suggestions);
    
    // Sugestões baseadas no moral do grupo
    this.addGroupMotivationSuggestions(groupContext.groupMorale, suggestions);
    
    // Sugestões adaptativas baseadas no histórico do usuário
    this.addAdaptiveSuggestions(userId, userInteractionHistory, suggestions);

    // Priorizar e limitar sugestões
    return suggestions
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
      .slice(0, 5);
  }

  private addCelebrationSuggestions(
    userId: UUID,
    recentAchievements: GroupContext['recentAchievements'],
    suggestions: InteractionSuggestion[]
  ): void {
    for (const achievement of recentAchievements) {
      if (achievement.userId === userId) continue; // Não sugerir parabenizar a si mesmo
      
      const hoursAgo = (Date.now() - achievement.achievedAt.getTime()) / (1000 * 60 * 60);
      if (hoursAgo > 48) continue; // Só sugerir parabenizar conquistas recentes
      
      const template = this.getRandomTemplate('celebration');
      const message = template
        .replace('{userName}', achievement.userName)
        .replace('{achievement}', achievement.badgeName);
      
      suggestions.push({
        type: 'celebration',
        targetUser: achievement.userId,
        messageTemplate: message,
        priority: 'high',
        context: { achievementId: achievement.badgeName },
        estimatedPoints: 15
      });
    }
  }

  private addEncouragementSuggestions(
    userId: UUID,
    strugglingMembers: GroupContext['strugglingMembers'],
    suggestions: InteractionSuggestion[]
  ): void {
    for (const member of strugglingMembers) {
      if (member.userId === userId) continue;
      
      const urgency = member.strugglingDays > 7 ? 'urgent' : 
                     member.strugglingDays > 3 ? 'high' : 'medium';
      
      const template = this.getRandomTemplate('encouragement');
      const message = template.replace('{userName}', member.userName);
      
      suggestions.push({
        type: 'encouragement',
        targetUser: member.userId,
        messageTemplate: message,
        priority: urgency,
        context: { 
          issueType: member.issueType,
          strugglingDays: member.strugglingDays 
        },
        estimatedPoints: 25
      });
    }
  }

  private addLearningOpportunitySuggestions(
    userId: UUID,
    topPerformers: GroupContext['topPerformers'],
    suggestions: InteractionSuggestion[]
  ): void {
    for (const performer of topPerformers) {
      if (performer.userId === userId) continue;
      
      suggestions.push({
        type: 'question',
        targetUser: performer.userId,
        messageTemplate: `${performer.userName}, vi que você está indo muito bem em ${performer.category}! Que dicas você daria?`,
        priority: 'medium',
        context: { 
          expertiseArea: performer.category,
          performanceScore: performer.score 
        },
        estimatedPoints: 10
      });
    }
  }

  private addGroupMotivationSuggestions(
    groupMorale: number,
    suggestions: InteractionSuggestion[]
  ): void {
    if (groupMorale < 70) {
      const template = this.getRandomTemplate('motivation');
      
      suggestions.push({
        type: 'encouragement',
        messageTemplate: template,
        priority: 'high',
        context: { groupMotivation: true },
        estimatedPoints: 30
      });
    }
  }

  private addAdaptiveSuggestions(
    userId: UUID,
    userHistory: SocialInteraction[],
    suggestions: InteractionSuggestion[]
  ): void {
    const recentInteractions = userHistory.filter(
      i => i.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    // Se o usuário foi pouco ativo socialmente
    if (recentInteractions.length < 2) {
      suggestions.push({
        type: 'tip_sharing',
        messageTemplate: 'Que tal compartilhar uma dica que funcionou bem para você?',
        priority: 'medium',
        context: { encourageParticipation: true },
        estimatedPoints: 20
      });
    }
    
    // Se o usuário não fez perguntas recentemente
    const recentQuestions = recentInteractions.filter(i => i.type === 'question');
    if (recentQuestions.length === 0) {
      suggestions.push({
        type: 'question',
        messageTemplate: 'Tem algum exercício ou técnica que você gostaria de melhorar? Pergunte ao grupo!',
        priority: 'low',
        context: { encourageQuestions: true },
        estimatedPoints: 10
      });
    }
  }

  analyzeGroupDynamics(
    groupInteractions: SocialInteraction[],
    memberProfiles: Array<{ userId: UUID; userName: string; joinedAt: Date }>
  ): GroupContext {
    // Implementação simplificada - em produção seria mais sofisticada
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentInteractions = groupInteractions.filter(i => i.createdAt >= weekAgo);
    const totalPossibleInteractions = memberProfiles.length * memberProfiles.length * 7; // Estimativa
    const engagementRate = recentInteractions.length / totalPossibleInteractions;
    
    // Calcular moral do grupo baseado na positividade das interações
    const positiveInteractions = recentInteractions.filter(
      i => ['celebration', 'encouragement', 'tip_sharing'].includes(i.type)
    );
    const groupMorale = Math.min(100, (positiveInteractions.length / Math.max(recentInteractions.length, 1)) * 100);
    
    return {
      groupId: crypto.randomUUID() as UUID, // Seria passado como parâmetro
      recentAchievements: [], // Seria populado com dados reais
      strugglingMembers: [], // Seria calculado baseado em dados de performance
      topPerformers: [], // Seria calculado baseado em métricas
      groupMorale,
      averageEngagement: engagementRate * 100
    };
  }

  private getRandomTemplate(type: keyof typeof this.messageTemplates): string {
    const templates = this.messageTemplates[type];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private getPriorityScore(priority: string): number {
    const scores = { urgent: 4, high: 3, medium: 2, low: 1 };
    return scores[priority as keyof typeof scores] || 1;
  }

  trackInteraction(interaction: Omit<SocialInteraction, 'id' | 'createdAt'>): SocialInteraction {
    return {
      ...interaction,
      id: crypto.randomUUID() as UUID,
      createdAt: new Date()
    };
  }

  calculateInteractionImpact(
    interaction: SocialInteraction,
    groupSize: number,
    groupEngagement: number
  ): {
    pointsAwarded: number;
    socialScoreImpact: number;
    groupMoraleImpact: number;
  } {
    const basePoints = this.interactionWeights[interaction.type as keyof typeof this.interactionWeights] || 1.0;
    
    // Multiplicador baseado no tamanho do grupo (grupos maiores = mais impacto)
    const groupSizeMultiplier = 1.0 + Math.log(groupSize) * 0.1;
    
    // Multiplicador baseado no engajamento atual (baixo engajamento = mais valorizado)
    const engagementMultiplier = groupEngagement < 0.3 ? 1.5 : 1.0;
    
    const pointsAwarded = Math.floor(basePoints * 10 * groupSizeMultiplier * engagementMultiplier);
    const socialScoreImpact = basePoints * 2;
    const groupMoraleImpact = ['celebration', 'encouragement', 'tip_sharing'].includes(interaction.type) ? 0.5 : 0;
    
    return {
      pointsAwarded,
      socialScoreImpact,
      groupMoraleImpact
    };
  }
}