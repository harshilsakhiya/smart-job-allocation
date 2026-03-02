const {
  calculateBidRanking,
  calculateAndUpdateRankings,
  calculateDistance,
  normalizeScore,
  DEFAULT_WEIGHTS,
  WORKLOAD_PENALTY_THRESHOLD,
  WORKLOAD_PENALTY_AMOUNT,
  URGENT_RESPONSE_TIME_MULTIPLIER
} = require('../../src/services/rankingService');

describe('Ranking Service', () => {
  
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      // New York City to Los Angeles
      const nyc = [-74.006, 40.7128];
      const la = [-118.2437, 34.0522];
      
      const distance = calculateDistance(nyc, la);
      
      // Distance should be approximately 3935 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return MAX_DISTANCE_KM for invalid coordinates', () => {
      const result = calculateDistance(null, [0, 0]);
      expect(result).toBe(100); // MAX_DISTANCE_KM
    });

    it('should return 0 for same coordinates', () => {
      const coord = [-74.006, 40.7128];
      const distance = calculateDistance(coord, coord);
      expect(distance).toBe(0);
    });
  });

  describe('normalizeScore', () => {
    it('should normalize value to 0-100 scale', () => {
      expect(normalizeScore(50, 0, 100, false)).toBe(50);
      expect(normalizeScore(0, 0, 100, false)).toBe(0);
      expect(normalizeScore(100, 0, 100, false)).toBe(100);
    });

    it('should handle inverse scoring correctly', () => {
      expect(normalizeScore(0, 0, 100, true)).toBe(100);
      expect(normalizeScore(100, 0, 100, true)).toBe(0);
      expect(normalizeScore(50, 0, 100, true)).toBe(50);
    });

    it('should clamp values outside range', () => {
      expect(normalizeScore(150, 0, 100, false)).toBe(100);
      expect(normalizeScore(-50, 0, 100, false)).toBe(0);
    });

    it('should handle null/undefined values', () => {
      expect(normalizeScore(null, 0, 100, false)).toBe(0);
      expect(normalizeScore(undefined, 0, 100, true)).toBe(100);
    });
  });

  describe('calculateBidRanking', () => {
    const mockContractor = {
      _id: 'contractor1',
      profile: {
        name: 'Test Contractor',
        trades: ['plumbing', 'electrical'],
        location: {
          zipCode: '10001',
          coordinates: [-74.006, 40.7128] // NYC
        }
      },
      metrics: {
        rating: 4.5,
        completionRate: 95,
        responseTimeAvg: 30,
        activeJobsCount: 2
      }
    };

    const mockJob = {
      _id: 'job1',
      title: 'Test Job',
      trade: 'plumbing',
      isUrgent: false,
      location: {
        coordinates: [-74.006, 40.7128] // Same as contractor (NYC)
      }
    };

    const mockBid = {
      _id: 'bid1',
      amount: 500,
      estimatedDays: 3
    };

    it('should calculate ranking with all factors', () => {
      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);

      expect(ranking).toHaveProperty('score');
      expect(ranking).toHaveProperty('factors');
      expect(ranking).toHaveProperty('weights');
      expect(ranking).toHaveProperty('calculatedAt');

      // Score should be between 0 and 100
      expect(ranking.score).toBeGreaterThanOrEqual(0);
      expect(ranking.score).toBeLessThanOrEqual(100);

      // All factors should be present
      expect(ranking.factors).toHaveProperty('distance');
      expect(ranking.factors).toHaveProperty('rating');
      expect(ranking.factors).toHaveProperty('completionRate');
      expect(ranking.factors).toHaveProperty('responseTime');
      expect(ranking.factors).toHaveProperty('tradeMatch');
      expect(ranking.factors).toHaveProperty('workloadPenalty');
    });

    it('should give perfect distance score when contractor is at same location', () => {
      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);
      
      expect(ranking.factors.distance.score).toBe(100);
      expect(ranking.factors.distance.rawValue).toBe(0);
    });

    it('should give high trade match score when trade matches', () => {
      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);
      
      expect(ranking.factors.tradeMatch.score).toBe(100);
      expect(ranking.factors.tradeMatch.rawValue).toBe(true);
    });

    it('should give zero trade match score when trade does not match', () => {
      const jobNoMatch = { ...mockJob, trade: 'carpentry' };
      const ranking = calculateBidRanking(mockBid, mockContractor, jobNoMatch);
      
      expect(ranking.factors.tradeMatch.score).toBe(0);
      expect(ranking.factors.tradeMatch.rawValue).toBe(false);
    });

    it('should apply workload penalty when active jobs >= 5', () => {
      const busyContractor = {
        ...mockContractor,
        metrics: {
          ...mockContractor.metrics,
          activeJobsCount: 5
        }
      };

      const ranking = calculateBidRanking(mockBid, busyContractor, mockJob);

      expect(ranking.factors.workloadPenalty.applied).toBe(true);
      expect(ranking.factors.workloadPenalty.penaltyAmount).toBe(15);
    });

    it('should not apply workload penalty when active jobs < 5', () => {
      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);

      expect(ranking.factors.workloadPenalty.applied).toBe(false);
      expect(ranking.factors.workloadPenalty.penaltyAmount).toBe(0);
    });

    it('should adjust weights for urgent jobs', () => {
      const urgentJob = { ...mockJob, isUrgent: true };
      
      const normalRanking = calculateBidRanking(mockBid, mockContractor, mockJob);
      const urgentRanking = calculateBidRanking(mockBid, mockContractor, urgentJob);

      // Response time weight should be doubled for urgent jobs
      expect(urgentRanking.weights.responseTime).toBe(
        normalRanking.weights.responseTime * URGENT_RESPONSE_TIME_MULTIPLIER
      );

      // Other weights should be reduced proportionally
      expect(urgentRanking.weights.distance).toBeLessThan(normalRanking.weights.distance);
    });

    it('should calculate rating score correctly', () => {
      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);
      
      // 4.5 rating out of 5 should give 90% score
      expect(ranking.factors.rating.score).toBeCloseTo(90, 0);
      expect(ranking.factors.rating.rawValue).toBe(4.5);
    });

    it('should calculate completion rate score correctly', () => {
      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);
      
      // 95% completion rate should give 95 score
      expect(ranking.factors.completionRate.score).toBe(95);
      expect(ranking.factors.completionRate.rawValue).toBe(95);
    });

    it('should handle contractor with no metrics', () => {
      const newContractor = {
        ...mockContractor,
        metrics: {
          rating: 0,
          completionRate: 0,
          responseTimeAvg: 0,
          activeJobsCount: 0
        }
      };

      const ranking = calculateBidRanking(mockBid, newContractor, mockJob);

      expect(ranking.score).toBeGreaterThanOrEqual(0);
      expect(ranking.factors.rating.score).toBe(0);
      expect(ranking.factors.completionRate.score).toBe(0);
    });
  });

  describe('Weight Validation', () => {
    it('should have weights that sum to 1.0', () => {
      const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should maintain weight sum of 1.0 after urgent adjustment', () => {
      const mockContractor = {
        profile: { trades: [], location: { coordinates: [0, 0] } },
        metrics: { rating: 3, completionRate: 50, responseTimeAvg: 60, activeJobsCount: 0 }
      };
      const mockJob = { trade: 'test', isUrgent: true, location: { coordinates: [0, 0] } };
      const mockBid = {};

      const ranking = calculateBidRanking(mockBid, mockContractor, mockJob);
      
      const sum = Object.values(ranking.weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });
});
