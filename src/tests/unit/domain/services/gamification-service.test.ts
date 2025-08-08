import { GamificationService, SessionData, UserContext } from '../../../domain/services/gamification-service';
import { UUID } from 'crypto';

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  const mockUserId = crypto.randomUUID() as UUID;

  beforeEach(() => {
    gamificationService = new GamificationService();
  });

  describe('calculateSessionPoints', () => {
    it('should calculate base points correctly', () => {
      const sessionData: SessionData = {
        completedExercises: 5,
        attended: true,
        averageFormScore: 7.0,
        helpedTeammates: 0,
        arrivedEarly: false,
        sessionDuration: 60,
        exerciseQuality: 8.0
      };

      const userContext: UserContext = {
        isBeginner: false,
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 0,
        totalSessions: 10,
        improvementRate: 20,
        socialScore: 50
      };

      const result = gamificationService.calculateSessionPoints(
        mockUserId, 
        sessionData, 
        userContext
      );

      const expectedBasePoints = 5 * 10 + 25; // exercises + attendance
      expect(result.basePoints).toBe(expectedBasePoints);
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.multiplier).toBe(1.0);
    });

    it('should apply perfect form bonus', () => {
      const sessionData: SessionData = {
        completedExercises: 3,
        attended: true,
        averageFormScore: 8.5, // Perfect form threshold
        helpedTeammates: 0,
        arrivedEarly: false,
        sessionDuration: 60,
        exerciseQuality: 9.0
      };

      const userContext: UserContext = {
        isBeginner: false,
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 0,
        totalSessions: 10,
        improvementRate: 20,
        socialScore: 50
      };

      const result = gamificationService.calculateSessionPoints(
        mockUserId,
        sessionData,
        userContext
      );

      expect(result.bonusPoints).toBeGreaterThanOrEqual(20); // Perfect form bonus
      expect(result.appliedBonuses).toContain('Execução perfeita');
    });

    it('should apply beginner multiplier', () => {
      const sessionData: SessionData = {
        completedExercises: 2,
        attended: true,
        averageFormScore: 6.0,
        helpedTeammates: 0,
        arrivedEarly: false,
        sessionDuration: 45,
        exerciseQuality: 6.0
      };

      const userContext: UserContext = {
        isBeginner: true, // Should get 1.2x multiplier
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 0,
        totalSessions: 1,
        improvementRate: 0,
        socialScore: 20
      };

      const result = gamificationService.calculateSessionPoints(
        mockUserId,
        sessionData,
        userContext
      );

      expect(result.multiplier).toBe(1.2);
      expect(result.appliedBonuses).toContain('Bonus iniciante');
    });

    it('should stack multiple multipliers', () => {
      const sessionData: SessionData = {
        completedExercises: 3,
        attended: true,
        averageFormScore: 7.0,
        helpedTeammates: 1,
        arrivedEarly: true,
        sessionDuration: 60,
        exerciseQuality: 7.5
      };

      const userContext: UserContext = {
        isBeginner: true,
        isComeback: true,
        isGroupLeader: true,
        isMentor: false,
        currentStreak: 5,
        totalSessions: 20,
        improvementRate: 30,
        socialScore: 75
      };

      const result = gamificationService.calculateSessionPoints(
        mockUserId,
        sessionData,
        userContext
      );

      // Should have multiple multipliers: beginner (1.2) * comeback (1.5) * leader (1.1)
      const expectedMultiplier = 1.2 * 1.5 * 1.1;
      expect(result.multiplier).toBeCloseTo(expectedMultiplier, 2);
      expect(result.appliedBonuses.length).toBeGreaterThan(1);
    });

    it('should calculate help teammates bonus', () => {
      const sessionData: SessionData = {
        completedExercises: 2,
        attended: true,
        averageFormScore: 6.0,
        helpedTeammates: 3,
        arrivedEarly: false,
        sessionDuration: 60,
        exerciseQuality: 6.0
      };

      const userContext: UserContext = {
        isBeginner: false,
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 0,
        totalSessions: 10,
        improvementRate: 15,
        socialScore: 60
      };

      const result = gamificationService.calculateSessionPoints(
        mockUserId,
        sessionData,
        userContext
      );

      const expectedHelpBonus = 3 * 15; // 3 teammates * 15 points each
      expect(result.bonusPoints).toBeGreaterThanOrEqual(expectedHelpBonus);
      expect(result.appliedBonuses).toContain('Ajudou 3 colegas');
    });
  });

  describe('calculateStreakBonus', () => {
    it('should return 0 for streak less than 3', () => {
      expect(gamificationService.calculateStreakBonus(0)).toBe(0);
      expect(gamificationService.calculateStreakBonus(1)).toBe(0);
      expect(gamificationService.calculateStreakBonus(2)).toBe(0);
    });

    it('should calculate normal bonus for streak 3-6', () => {
      const streak5 = gamificationService.calculateStreakBonus(5);
      expect(streak5).toBe(5 * 5); // 5 days * 5 points per day
    });

    it('should apply 1.5x multiplier for streak 7-14', () => {
      const streak7 = gamificationService.calculateStreakBonus(7);
      expect(streak7).toBe(7 * 5 * 1.5); // 7 days * 5 points * 1.5 multiplier
    });

    it('should apply 2x multiplier for streak 15-29', () => {
      const streak20 = gamificationService.calculateStreakBonus(20);
      expect(streak20).toBe(20 * 5 * 2); // 20 days * 5 points * 2 multiplier
    });

    it('should apply 3x multiplier for streak 30+', () => {
      const streak30 = gamificationService.calculateStreakBonus(30);
      expect(streak30).toBe(30 * 5 * 3); // 30 days * 5 points * 3 multiplier
    });
  });

  describe('determineBadgeEligibility', () => {
    it('should identify first session badge', () => {
      const userStats = {
        totalSessions: 1,
        currentStreak: 0,
        teammatesHelped: 0,
        leadershipScore: 0,
        improvementRate: 0,
        mentoringSession: 0,
        perfectFormStreak: 0
      };

      const badges = gamificationService.determineBadgeEligibility(userStats);
      expect(badges).toContain('first_session');
    });

    it('should identify consistency master badge', () => {
      const userStats = {
        totalSessions: 20,
        currentStreak: 15,
        teammatesHelped: 5,
        leadershipScore: 60,
        improvementRate: 15,
        mentoringSession: 2,
        perfectFormStreak: 3
      };

      const badges = gamificationService.determineBadgeEligibility(userStats);
      expect(badges).toContain('consistency_master');
    });

    it('should identify multiple badges when eligible', () => {
      const userStats = {
        totalSessions: 50,
        currentStreak: 30,
        teammatesHelped: 12,
        leadershipScore: 85,
        improvementRate: 30,
        mentoringSession: 6,
        perfectFormStreak: 5
      };

      const badges = gamificationService.determineBadgeEligibility(userStats);
      
      expect(badges).toContain('streak_warrior');
      expect(badges).toContain('team_player');
      expect(badges).toContain('natural_leader');
      expect(badges).toContain('rapid_improver');
      expect(badges).toContain('mentor');
      expect(badges).toContain('perfect_form');
      expect(badges.length).toBeGreaterThan(3);
    });

    it('should return empty array when no badges are eligible', () => {
      const userStats = {
        totalSessions: 5,
        currentStreak: 2,
        teammatesHelped: 1,
        leadershipScore: 30,
        improvementRate: 5,
        mentoringSession: 0,
        perfectFormStreak: 1
      };

      const badges = gamificationService.determineBadgeEligibility(userStats);
      expect(badges.length).toBe(0);
    });
  });

  describe('getBadgeDefinition', () => {
    it('should return correct badge definition', () => {
      const badge = gamificationService.getBadgeDefinition('first_session');
      
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('first_session');
      expect(badge?.name).toBe('Primeiro Passo');
      expect(badge?.category).toBe('achievement');
      expect(badge?.rarity).toBe('common');
    });

    it('should return null for invalid badge id', () => {
      const badge = gamificationService.getBadgeDefinition('invalid_badge');
      expect(badge).toBeNull();
    });
  });

  describe('generatePersonalizedChallenges', () => {
    it('should generate streak challenge based on current streak', () => {
      const userStats: UserContext = {
        isBeginner: false,
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 2,
        totalSessions: 5,
        improvementRate: 10,
        socialScore: 40
      };

      const challenges = gamificationService.generatePersonalizedChallenges(
        mockUserId,
        userStats
      );

      const streakChallenge = challenges.find(c => c.category === 'streak');
      expect(streakChallenge).toBeDefined();
      expect(streakChallenge?.target).toBeGreaterThan(userStats.currentStreak);
    });

    it('should generate social challenge for low social score', () => {
      const userStats: UserContext = {
        isBeginner: false,
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 5,
        totalSessions: 10,
        improvementRate: 15,
        socialScore: 30 // Low social score
      };

      const challenges = gamificationService.generatePersonalizedChallenges(
        mockUserId,
        userStats
      );

      const socialChallenge = challenges.find(c => c.category === 'social');
      expect(socialChallenge).toBeDefined();
      expect(socialChallenge?.name).toContain('Social');
    });

    it('should limit challenges to maximum of 3', () => {
      const userStats: UserContext = {
        isBeginner: true,
        isComeback: true,
        isGroupLeader: true,
        isMentor: false,
        currentStreak: 1,
        totalSessions: 2,
        improvementRate: 5,
        socialScore: 20
      };

      const challenges = gamificationService.generatePersonalizedChallenges(
        mockUserId,
        userStats
      );

      expect(challenges.length).toBeLessThanOrEqual(3);
    });

    it('should generate adaptive challenge for low improvement', () => {
      const userStats: UserContext = {
        isBeginner: false,
        isComeback: false,
        isGroupLeader: false,
        isMentor: false,
        currentStreak: 10,
        totalSessions: 20,
        improvementRate: 5, // Low improvement rate
        socialScore: 60
      };

      const challenges = gamificationService.generatePersonalizedChallenges(
        mockUserId,
        userStats
      );

      const adaptiveChallenge = challenges.find(c => c.category === 'progress');
      expect(adaptiveChallenge).toBeDefined();
      expect(adaptiveChallenge?.name).toContain('Evolução');
    });
  });
});