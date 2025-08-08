import { UUID } from 'crypto';

export interface UserGameProfile {
  id: UUID;
  userId: UUID;
  currentPoints: number;
  totalEarnedPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  achievements: Achievement[];
  socialScore: number;
  leaderboardRank?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'achievement' | 'social' | 'consistency' | 'progress' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  progress?: {
    current: number;
    target: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsAwarded: number;
  multiplierApplied?: number;
  earnedAt: Date;
  sessionId?: UUID;
  context?: Record<string, any>;
}

export interface PointsTransaction {
  id: UUID;
  userId: UUID;
  amount: number;
  type: 'earned' | 'spent' | 'bonus' | 'penalty';
  source: 'exercise' | 'session' | 'social' | 'streak' | 'achievement' | 'system';
  description: string;
  multiplier?: number;
  sessionId?: UUID;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class UserGameProfileEntity implements UserGameProfile {
  constructor(
    public id: UUID,
    public userId: UUID,
    public currentPoints: number,
    public totalEarnedPoints: number,
    public level: number,
    public currentStreak: number,
    public longestStreak: number,
    public badges: Badge[],
    public achievements: Achievement[],
    public socialScore: number,
    public leaderboardRank: number | undefined,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  addPoints(amount: number, source: string, multiplier: number = 1): PointsTransaction {
    const finalAmount = Math.floor(amount * multiplier);
    this.currentPoints += finalAmount;
    this.totalEarnedPoints += finalAmount;
    
    // Verificar se subiu de level
    const newLevel = this.calculateLevel(this.totalEarnedPoints);
    const leveledUp = newLevel > this.level;
    this.level = newLevel;
    
    this.updatedAt = new Date();

    return {
      id: crypto.randomUUID() as UUID,
      userId: this.userId,
      amount: finalAmount,
      type: 'earned',
      source: source as any,
      description: `Points earned from ${source}`,
      multiplier,
      createdAt: new Date()
    };
  }

  updateStreak(newStreak: number): boolean {
    const streakBroken = newStreak === 0 && this.currentStreak > 0;
    const newRecord = newStreak > this.longestStreak;
    
    this.currentStreak = newStreak;
    if (newRecord) {
      this.longestStreak = newStreak;
    }
    
    this.updatedAt = new Date();
    
    return !streakBroken;
  }

  awardBadge(badge: Omit<Badge, 'earnedAt'>): void {
    const existingBadge = this.badges.find(b => b.id === badge.id);
    if (!existingBadge) {
      this.badges.push({
        ...badge,
        earnedAt: new Date()
      });
      this.updatedAt = new Date();
    }
  }

  addAchievement(achievement: Omit<Achievement, 'earnedAt'>): void {
    this.achievements.push({
      ...achievement,
      earnedAt: new Date()
    });
    this.updatedAt = new Date();
  }

  updateSocialScore(interactions: SocialInteraction[]): void {
    this.socialScore = this.calculateSocialScore(interactions);
    this.updatedAt = new Date();
  }

  private calculateLevel(totalPoints: number): number {
    // Fórmula exponencial para níveis
    // Level 1: 0-100 pontos, Level 2: 101-250, Level 3: 251-500, etc.
    if (totalPoints < 100) return 1;
    return Math.floor(Math.log2(totalPoints / 50)) + 1;
  }

  private calculateSocialScore(interactions: SocialInteraction[]): number {
    const weights = {
      encouragement: 2.0,
      help_request: 1.5,
      tip_sharing: 2.5,
      celebration: 1.0,
      question: 1.0,
      answer: 2.0
    };

    let totalScore = 0;
    const now = new Date();

    for (const interaction of interactions) {
      const weight = weights[interaction.type as keyof typeof weights] || 1.0;
      
      // Multiplicador de qualidade baseado em likes e respostas
      const qualityMultiplier = 1.0 + (interaction.likes * 0.1) + (interaction.responses * 0.2);
      
      // Multiplicador de recência (interactions mais recentes valem mais)
      const daysSince = Math.floor((now.getTime() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const recencyMultiplier = Math.max(0.1, 1.0 - (daysSince * 0.1));
      
      totalScore += weight * qualityMultiplier * recencyMultiplier;
    }

    return Math.min(totalScore, 100); // Cap em 100
  }

  getPointsToNextLevel(): number {
    const nextLevel = this.level + 1;
    const pointsForNextLevel = Math.pow(2, nextLevel - 1) * 50;
    return Math.max(0, pointsForNextLevel - this.totalEarnedPoints);
  }

  getProgressToNextLevel(): number {
    const currentLevelPoints = this.level === 1 ? 0 : Math.pow(2, this.level - 2) * 50;
    const nextLevelPoints = Math.pow(2, this.level - 1) * 50;
    const progress = (this.totalEarnedPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints);
    return Math.min(1, Math.max(0, progress));
  }
}

export interface SocialInteraction {
  id: UUID;
  userId: UUID;
  targetUserId?: UUID;
  type: 'encouragement' | 'help_request' | 'tip_sharing' | 'celebration' | 'question' | 'answer';
  content: string;
  likes: number;
  responses: number;
  groupId?: UUID;
  sessionId?: UUID;
  createdAt: Date;
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