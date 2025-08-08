import { AdherencePredictionService, PatientData } from '../../../domain/services/ai-prediction-service';
import { UUID } from 'crypto';

describe('AdherencePredictionService', () => {
  let predictionService: AdherencePredictionService;
  let mockPatientData: PatientData;

  beforeEach(() => {
    predictionService = new AdherencePredictionService();
    
    mockPatientData = {
      id: crypto.randomUUID() as UUID,
      age: 35,
      gender: 'female',
      medicalConditions: ['lower_back_pain'],
      previousTherapyExperience: 0,
      initialPainLevel: 7,
      motivationScore: 8,
      sessionsAttended: 10,
      sessionsMissed: 2,
      lateArrivals: 1,
      earlyDepartures: 0,
      appUsageFrequency: 5,
      exerciseCompletionRate: 85,
      socialInteractions: 12,
      feedbackProvided: 8,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      currentStreak: 5,
      longestStreak: 8,
      painImprovement: 40,
      functionalImprovement: 35,
      satisfactionScore: 8,
      groupSize: 6,
      groupCohesionScore: 7,
      peerSupportReceived: 10
    };
  });

  describe('prepareFeatures', () => {
    it('should extract correct number of features', () => {
      const features = predictionService.prepareFeatures(mockPatientData);
      expect(features).toHaveLength(26); // Based on FEATURE_NAMES array length
    });

    it('should handle demographic features correctly', () => {
      const features = predictionService.prepareFeatures(mockPatientData);
      
      expect(features[0]).toBe(35); // age
      expect(features[1]).toBe(1); // gender_female (should be 1 for female)
    });

    it('should handle medical conditions correctly', () => {
      const patientWithMultipleConditions = {
        ...mockPatientData,
        medicalConditions: ['chronic_pain', 'post_surgery', 'sports_injury']
      };
      
      const features = predictionService.prepareFeatures(patientWithMultipleConditions);
      
      expect(features[2]).toBe(3); // medical_conditions_count
      expect(features[3]).toBe(1); // chronic_pain present
      expect(features[4]).toBe(1); // post_surgery present
      expect(features[5]).toBe(1); // sports_injury present
    });

    it('should calculate days in program correctly', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const patientWith30Days = {
        ...mockPatientData,
        startDate: thirtyDaysAgo
      };
      
      const features = predictionService.prepareFeatures(patientWith30Days);
      const daysInProgramIndex = 17; // Based on feature order
      
      expect(features[daysInProgramIndex]).toBeCloseTo(30, 0);
    });

    it('should handle male gender correctly', () => {
      const malePatient = {
        ...mockPatientData,
        gender: 'male' as const
      };
      
      const features = predictionService.prepareFeatures(malePatient);
      expect(features[1]).toBe(0); // gender_female should be 0 for male
    });
  });

  describe('predictAdherenceRisk', () => {
    it('should return risk assessment with all required fields', async () => {
      const assessment = await predictionService.predictAdherenceRisk(mockPatientData);
      
      expect(assessment).toHaveProperty('riskProbability');
      expect(assessment).toHaveProperty('riskLevel');
      expect(assessment).toHaveProperty('riskClass');
      expect(assessment).toHaveProperty('recommendation');
      expect(assessment).toHaveProperty('riskFactors');
      expect(assessment).toHaveProperty('confidence');
      expect(assessment).toHaveProperty('interventions');
    });

    it('should classify risk probability correctly', async () => {
      const assessment = await predictionService.predictAdherenceRisk(mockPatientData);
      
      expect(assessment.riskProbability).toBeGreaterThanOrEqual(0);
      expect(assessment.riskProbability).toBeLessThanOrEqual(1);
      
      if (assessment.riskProbability > 0.7) {
        expect(assessment.riskLevel).toBe('high');
      } else if (assessment.riskProbability > 0.4) {
        expect(assessment.riskLevel).toBe('medium');
      } else {
        expect(assessment.riskLevel).toBe('low');
      }
    });

    it('should identify high risk for poor indicators', async () => {
      const highRiskPatient = {
        ...mockPatientData,
        motivationScore: 3, // Low motivation
        satisfactionScore: 4, // Low satisfaction
        sessionsMissed: 8, // Many missed sessions
        painImprovement: 5, // Poor progress
        exerciseCompletionRate: 30 // Low completion rate
      };
      
      const assessment = await predictionService.predictAdherenceRisk(highRiskPatient);
      
      // Should have multiple risk factors
      expect(assessment.riskFactors.length).toBeGreaterThan(2);
      expect(assessment.riskFactors.some(rf => rf.severity === 'high')).toBe(true);
    });

    it('should identify low risk for good indicators', async () => {
      const lowRiskPatient = {
        ...mockPatientData,
        motivationScore: 9, // High motivation
        satisfactionScore: 9, // High satisfaction
        sessionsMissed: 0, // No missed sessions
        painImprovement: 60, // Good progress
        exerciseCompletionRate: 95, // High completion rate
        socialInteractions: 20, // Very social
        currentStreak: 15 // Good streak
      };
      
      const assessment = await predictionService.predictAdherenceRisk(lowRiskPatient);
      
      // Should have fewer or less severe risk factors
      expect(assessment.riskLevel).toBe('low');
      expect(assessment.riskFactors.length).toBeLessThan(3);
    });

    it('should provide appropriate recommendations', async () => {
      const assessment = await predictionService.predictAdherenceRisk(mockPatientData);
      
      expect(assessment.recommendation).toBeTruthy();
      expect(typeof assessment.recommendation).toBe('string');
      expect(assessment.recommendation.length).toBeGreaterThan(10);
    });

    it('should generate relevant interventions', async () => {
      const assessment = await predictionService.predictAdherenceRisk(mockPatientData);
      
      expect(Array.isArray(assessment.interventions)).toBe(true);
      
      if (assessment.interventions.length > 0) {
        const intervention = assessment.interventions[0];
        expect(intervention).toHaveProperty('type');
        expect(intervention).toHaveProperty('priority');
        expect(intervention).toHaveProperty('action');
        expect(intervention).toHaveProperty('responsible');
        expect(intervention).toHaveProperty('description');
        expect(intervention).toHaveProperty('estimatedImpact');
        expect(intervention).toHaveProperty('timeToComplete');
      }
    });
  });

  describe('risk factor identification', () => {
    it('should identify high absence rate', async () => {
      const patientWithHighAbsence = {
        ...mockPatientData,
        sessionsMissed: 6
      };
      
      const assessment = await predictionService.predictAdherenceRisk(patientWithHighAbsence);
      const hasAbsenceFactor = assessment.riskFactors.some(
        rf => rf.factor === 'high_absence_rate'
      );
      
      expect(hasAbsenceFactor).toBe(true);
    });

    it('should identify low app engagement', async () => {
      const patientWithLowEngagement = {
        ...mockPatientData,
        appUsageFrequency: 1
      };
      
      const assessment = await predictionService.predictAdherenceRisk(patientWithLowEngagement);
      const hasEngagementFactor = assessment.riskFactors.some(
        rf => rf.factor === 'low_app_engagement'
      );
      
      expect(hasEngagementFactor).toBe(true);
    });

    it('should identify social isolation', async () => {
      const isolatedPatient = {
        ...mockPatientData,
        socialInteractions: 0
      };
      
      const assessment = await predictionService.predictAdherenceRisk(isolatedPatient);
      const hasIsolationFactor = assessment.riskFactors.some(
        rf => rf.factor === 'social_isolation'
      );
      
      expect(hasIsolationFactor).toBe(true);
    });

    it('should identify slow progress', async () => {
      const slowProgressPatient = {
        ...mockPatientData,
        painImprovement: 5
      };
      
      const assessment = await predictionService.predictAdherenceRisk(slowProgressPatient);
      const hasProgressFactor = assessment.riskFactors.some(
        rf => rf.factor === 'slow_pain_progress'
      );
      
      expect(hasProgressFactor).toBe(true);
    });

    it('should sort risk factors by impact', async () => {
      const multiRiskPatient = {
        ...mockPatientData,
        sessionsMissed: 5,
        socialInteractions: 0,
        painImprovement: 8,
        satisfactionScore: 4
      };
      
      const assessment = await predictionService.predictAdherenceRisk(multiRiskPatient);
      
      if (assessment.riskFactors.length > 1) {
        for (let i = 1; i < assessment.riskFactors.length; i++) {
          expect(assessment.riskFactors[i-1].impact)
            .toBeGreaterThanOrEqual(assessment.riskFactors[i].impact);
        }
      }
    });
  });

  describe('intervention generation', () => {
    it('should generate immediate contact for high risk', async () => {
      const highRiskPatient = {
        ...mockPatientData,
        satisfactionScore: 3,
        sessionsMissed: 8,
        painImprovement: 5
      };
      
      const assessment = await predictionService.predictAdherenceRisk(highRiskPatient);
      
      if (assessment.riskLevel === 'high') {
        const hasImmediateContact = assessment.interventions.some(
          i => i.type === 'immediate_contact' && i.priority === 'urgent'
        );
        expect(hasImmediateContact).toBe(true);
      }
    });

    it('should prioritize interventions by estimated impact', async () => {
      const assessment = await predictionService.predictAdherenceRisk(mockPatientData);
      
      if (assessment.interventions.length > 1) {
        for (let i = 1; i < assessment.interventions.length; i++) {
          expect(assessment.interventions[i-1].estimatedImpact)
            .toBeGreaterThanOrEqual(assessment.interventions[i].estimatedImpact);
        }
      }
    });
  });

  describe('batchPredict', () => {
    it('should process multiple patients', async () => {
      const patients = [
        mockPatientData,
        { ...mockPatientData, id: crypto.randomUUID() as UUID, age: 45 },
        { ...mockPatientData, id: crypto.randomUUID() as UUID, age: 25 }
      ];
      
      const predictions = await predictionService.batchPredict(patients);
      
      expect(predictions).toHaveLength(3);
      expect(predictions.every(p => p.riskProbability >= 0 && p.riskProbability <= 1)).toBe(true);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from predictions', async () => {
      const predictions = [
        await predictionService.predictAdherenceRisk(mockPatientData),
        await predictionService.predictAdherenceRisk({
          ...mockPatientData,
          id: crypto.randomUUID() as UUID,
          satisfactionScore: 3 // High risk patient
        })
      ];
      
      const insights = predictionService.generateInsights(predictions);
      
      expect(insights).toHaveProperty('highRiskCount');
      expect(insights).toHaveProperty('averageRisk');
      expect(insights).toHaveProperty('commonRiskFactors');
      expect(insights).toHaveProperty('recommendedInterventions');
      
      expect(typeof insights.highRiskCount).toBe('number');
      expect(typeof insights.averageRisk).toBe('number');
      expect(Array.isArray(insights.commonRiskFactors)).toBe(true);
      expect(Array.isArray(insights.recommendedInterventions)).toBe(true);
    });
  });
});