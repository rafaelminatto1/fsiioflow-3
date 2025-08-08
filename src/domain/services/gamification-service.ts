import { UUID } from 'crypto';
import { UserGameProfileEntity, PointsTransaction, Badge, Achievement, SocialInteraction } from '../entities/gamification';

export interface PointsCalculationResult {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  multiplier: number;
  reason: string;
  appliedBonuses: string[];
}

export interface SessionData {
  completedExercises: number;
  attended: boolean;
  averageFormScore: number;
  helpedTeammates: number;
  arrivedEarly: boolean;
  sessionDuration: number;
  exerciseQuality: number;
}

export interface UserContext {
  isBeginner: boolean;
  isComeback: boolean;
  isGroupLeader: boolean;
  isMentor: boolean;
  currentStreak: number;
  totalSessions: number;
  improvementRate: number;
  socialScore: number;
}

export class GamificationService {
  private readonly pointRules = {
    exerciseCompleted: 10,
    groupSessionAttended: 25,
    helpedTeammate: 15,
    dailyStreak: 5,
    weeklyGoalAchieved: 50,
    perfectFormFeedback: 20,
    earlyArrival: 5,
    positiveAttitude: 10,
    firstSession: 30,
    weeklyAttendance: 40
  };

  private readonly multipliers = {
    beginner: 1.2,
    comeback: 1.5,
    leader: 1.1,
    mentor: 1.3,
    perfectWeek: 1.4
  };

  private readonly badgeDefinitions: Record<string, Omit<Badge, 'earnedAt'>> = {
    first_session: {
      id: 'first_session',
      name: 'Primeiro Passo',
      description: 'Completou sua primeira sessão',
      iconUrl: '/badges/first-step.svg',
      category: 'achievement',
      rarity: 'common'
    },
    consistency_master: {
      id: 'consistency_master',
      name: 'Mestre da Consistência',
      description: 'Manteve streak de 15 dias',
      iconUrl: '/badges/consistency.svg',
      category: 'consistency',
      rarity: 'rare'
    },
    team_player: {
      id: 'team_player',
      name: 'Espírito de Equipe',
      description: 'Ajudou 10 colegas',
      iconUrl: '/badges/team-player.svg',
      category: 'social',
      rarity: 'uncommon'
    },
    natural_leader: {
      id: 'natural_leader',
      name: 'Líder Natural',
      description: 'Score de liderança acima de 80',
      iconUrl: '/badges/leader.svg',
      category: 'social',
      rarity: 'epic'
    },
    rapid_improver: {
      id: 'rapid_improver',
      name: 'Evolução Rápida',
      description: 'Melhorou 25% em um mês',
      iconUrl: '/badges/improvement.svg',
      category: 'progress',
      rarity: 'rare'
    },
    mentor: {
      id: 'mentor',
      name: 'Mentor',
      description: 'Conduziu 5 sessões de mentoria',
      iconUrl: '/badges/mentor.svg',
      category: 'special',
      rarity: 'legendary'
    },
    streak_warrior: {
      id: 'streak_warrior',
      name: 'Guerreiro da Constância',
      description: 'Streak de 30 dias',
      iconUrl: '/badges/warrior.svg',
      category: 'consistency',
      rarity: 'epic'
    },
    perfect_form: {
      id: 'perfect_form',
      name: 'Forma Perfeita',
      description: 'Manteve score perfeito por 5 sessões',
      iconUrl: '/badges/perfect-form.svg',
      category: 'achievement',
      rarity: 'rare'
    }
  };

  calculateSessionPoints(
    userId: UUID,
    sessionData: SessionData,
    userContext: UserContext
  ): PointsCalculationResult {
    let basePoints = 0;
    let bonusPoints = 0;
    const appliedBonuses: string[] = [];

    // Pontos base por exercícios completados
    basePoints += sessionData.completedExercises * this.pointRules.exerciseCompleted;

    // Pontos por participação na sessão
    if (sessionData.attended) {
      basePoints += this.pointRules.groupSessionAttended;
    }

    // Bonus por qualidade da execução
    if (sessionData.averageFormScore >= 8.0) {
      bonusPoints += this.pointRules.perfectFormFeedback;
      appliedBonuses.push('Execução perfeita');
    }

    // Bonus por ajudar colegas
    bonusPoints += sessionData.helpedTeammates * this.pointRules.helpedTeammate;
    if (sessionData.helpedTeammates > 0) {
      appliedBonuses.push(`Ajudou ${sessionData.helpedTeammates} colegas`);
    }

    // Bonus por chegada antecipada
    if (sessionData.arrivedEarly) {
      bonusPoints += this.pointRules.earlyArrival;
      appliedBonuses.push('Chegada antecipada');
    }

    // Calcular multiplicadores
    let totalMultiplier = 1.0;

    if (userContext.isBeginner) {
      totalMultiplier *= this.multipliers.beginner;
      appliedBonuses.push('Bonus iniciante');
    }

    if (userContext.isComeback) {
      totalMultiplier *= this.multipliers.comeback;
      appliedBonuses.push('Bonus retorno');
    }

    if (userContext.isGroupLeader) {
      totalMultiplier *= this.multipliers.leader;
      appliedBonuses.push('Bonus liderança');
    }

    if (userContext.isMentor) {
      totalMultiplier *= this.multipliers.mentor;
      appliedBonuses.push('Bonus mentor');
    }

    // Bonus por streak
    const streakBonus = this.calculateStreakBonus(userContext.currentStreak);
    bonusPoints += streakBonus;
    if (streakBonus > 0) {
      appliedBonuses.push(`Streak de ${userContext.currentStreak} dias`);
    }

    // Aplicar multiplicadores
    const totalBeforeMultiplier = basePoints + bonusPoints;
    const totalPoints = Math.floor(totalBeforeMultiplier * totalMultiplier);

    return {
      basePoints,
      bonusPoints,
      totalPoints,
      multiplier: totalMultiplier,
      reason: `Sessão completada com ${appliedBonuses.length} bônus aplicados`,
      appliedBonuses
    };
  }

  calculateStreakBonus(currentStreak: number): number {
    if (currentStreak >= 30) {
      return currentStreak * this.pointRules.dailyStreak * 3; // Bonus triplo para streaks épicos
    } else if (currentStreak >= 15) {
      return currentStreak * this.pointRules.dailyStreak * 2; // Bonus dobrado para streaks grandes
    } else if (currentStreak >= 7) {
      return currentStreak * this.pointRules.dailyStreak * 1.5; // Bonus de 50% para uma semana
    } else if (currentStreak >= 3) {
      return currentStreak * this.pointRules.dailyStreak;
    }
    
    return 0;
  }

  determineBadgeEligibility(userStats: {
    totalSessions: number;
    currentStreak: number;
    teammatesHelped: number;
    leadershipScore: number;
    improvementRate: number;
    mentoringSession: number;
    perfectFormStreak: number;
  }): string[] {
    const eligibleBadges: string[] = [];

    // Badge de primeira sessão
    if (userStats.totalSessions === 1) {
      eligibleBadges.push('first_session');
    }

    // Badge de consistência
    if (userStats.currentStreak >= 15) {
      eligibleBadges.push('consistency_master');
    }

    // Badge de streak warrior
    if (userStats.currentStreak >= 30) {
      eligibleBadges.push('streak_warrior');
    }

    // Badge de colaboração
    if (userStats.teammatesHelped >= 10) {
      eligibleBadges.push('team_player');
    }

    // Badge de liderança
    if (userStats.leadershipScore >= 80) {
      eligibleBadges.push('natural_leader');
    }

    // Badge de progresso
    if (userStats.improvementRate >= 25) {
      eligibleBadges.push('rapid_improver');
    }

    // Badge de mentor
    if (userStats.mentoringSession >= 5) {
      eligibleBadges.push('mentor');
    }

    // Badge de forma perfeita
    if (userStats.perfectFormStreak >= 5) {
      eligibleBadges.push('perfect_form');
    }

    return eligibleBadges;
  }

  getBadgeDefinition(badgeId: string): Badge | null {
    const definition = this.badgeDefinitions[badgeId];
    if (!definition) return null;

    return {
      ...definition,
      earnedAt: new Date() // Seria ajustado quando realmente ganho
    };
  }

  generatePersonalizedChallenges(
    userId: UUID,
    userStats: UserContext,
    groupContext?: { groupId: UUID; memberStats: any[] }
  ): Challenge[] {
    const challenges: Challenge[] = [];

    // Desafio individual baseado no streak atual
    const streakChallenge = this.generateStreakChallenge(userStats);
    if (streakChallenge) {
      challenges.push(streakChallenge);
    }

    // Desafio social baseado na pontuação social
    const socialChallenge = this.generateSocialChallenge(userStats);
    if (socialChallenge) {
      challenges.push(socialChallenge);
    }

    // Desafio de grupo se aplicável
    if (groupContext) {
      const groupChallenge = this.generateGroupChallenge(groupContext);
      if (groupChallenge) {
        challenges.push(groupChallenge);
      }
    }

    // Desafio adaptativo baseado em dificuldades
    const adaptiveChallenge = this.generateAdaptiveChallenge(userStats);
    if (adaptiveChallenge) {
      challenges.push(adaptiveChallenge);
    }

    return challenges.slice(0, 3); // Limitar a 3 desafios ativos
  }

  private generateStreakChallenge(userStats: UserContext): Challenge | null {
    let targetDays: number;
    
    if (userStats.currentStreak < 3) {
      targetDays = 3;
    } else if (userStats.currentStreak < 7) {
      targetDays = 7;
    } else if (userStats.currentStreak < 15) {
      targetDays = 15;
    } else {
      targetDays = userStats.currentStreak + 7;
    }

    return {
      id: crypto.randomUUID() as UUID,
      name: `Streak de ${targetDays} dias`,
      description: `Complete exercícios por ${targetDays} dias consecutivos`,
      type: 'individual',
      category: 'streak',
      difficulty: targetDays >= 15 ? 'hard' : targetDays >= 7 ? 'medium' : 'easy',
      target: targetDays,
      currentProgress: userStats.currentStreak,
      rewardPoints: targetDays * 20,
      rewardBadge: targetDays >= 15 ? 'consistency_master' : undefined,
      startDate: new Date(),
      endDate: new Date(Date.now() + (targetDays + 7) * 24 * 60 * 60 * 1000),
      participants: [],
      status: 'active',
      createdAt: new Date()
    };
  }

  private generateSocialChallenge(userStats: UserContext): Challenge | null {
    if (userStats.socialScore >= 80) return null; // Já muito ativo socialmente

    return {
      id: crypto.randomUUID() as UUID,
      name: 'Conexão Social',
      description: 'Interaja positivamente com 5 colegas esta semana',
      type: 'individual',
      category: 'social',
      difficulty: 'easy',
      target: 5,
      currentProgress: 0,
      rewardPoints: 75,
      rewardBadge: 'team_player',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participants: [],
      status: 'active',
      createdAt: new Date()
    };
  }

  private generateGroupChallenge(groupContext: { groupId: UUID; memberStats: any[] }): Challenge | null {
    return {
      id: crypto.randomUUID() as UUID,
      name: 'Espírito de Equipe',
      description: 'Grupo alcançar 90% de presença por 2 semanas',
      type: 'group',
      category: 'attendance',
      difficulty: 'medium',
      target: 90,
      currentProgress: 0,
      rewardPoints: 200,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      participants: groupContext.memberStats.map(m => m.userId),
      status: 'active',
      requirements: { groupId: groupContext.groupId },
      createdAt: new Date()
    };
  }

  private generateAdaptiveChallenge(userStats: UserContext): Challenge | null {
    // Gerar desafio baseado na área que mais precisa melhorar
    if (userStats.improvementRate < 10) {
      return {
        id: crypto.randomUUID() as UUID,
        name: 'Foco na Evolução',
        description: 'Melhore sua pontuação média em 15% nas próximas 5 sessões',
        type: 'individual',
        category: 'progress',
        difficulty: 'medium',
        target: 15,
        currentProgress: 0,
        rewardPoints: 150,
        rewardBadge: 'rapid_improver',
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        participants: [],
        status: 'active',
        createdAt: new Date()
      };
    }

    return null;
  }
}

export interface Challenge {
  id: UUID;
  name: string;
  description: string;
  type: 'individual' | 'group' | 'global';
  category: 'streak' | 'social' | 'exercise' | 'attendance' | 'progress';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  target: number;
  currentProgress: number;
  rewardPoints: number;
  rewardBadge?: string;
  startDate: Date;
  endDate: Date;
  participants: UUID[];
  status: 'active' | 'completed' | 'expired' | 'paused';
  requirements?: Record<string, any>;
  createdAt: Date;
}