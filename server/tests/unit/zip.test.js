const {
  calculateCompositeScore,
  validateWeights,
  ZIP_WEIGHTS,
  isValidZipCode
} = require('../../src/services/zipService');

describe('ZIP Intelligence Service', () => {
  
  describe('validateWeights', () => {
    it('should return true for valid weights summing to 1.0', () => {
      const validWeights = {
        mobility: 0.30,
        businessActivity: 0.25,
        demographicFit: 0.20,
        seasonalDemand: 0.25
      };
      
      expect(validateWeights(validWeights)).toBe(true);
    });

    it('should return true for weights with small floating point error', () => {
      const weights = {
        mobility: 0.3333,
        businessActivity: 0.3333,
        demographicFit: 0.3334,
        seasonalDemand: 0
      };
      
      expect(validateWeights(weights)).toBe(true);
    });

    it('should return false for weights not summing to 1.0', () => {
      const invalidWeights = {
        mobility: 0.30,
        businessActivity: 0.30,
        demographicFit: 0.30,
        seasonalDemand: 0.30
      };
      
      expect(validateWeights(invalidWeights)).toBe(false);
    });

    it('should return false for weights summing to less than 1.0', () => {
      const invalidWeights = {
        mobility: 0.20,
        businessActivity: 0.20,
        demographicFit: 0.20,
        seasonalDemand: 0.20
      };
      
      expect(validateWeights(invalidWeights)).toBe(false);
    });
  });

  describe('calculateCompositeScore', () => {
    it('should calculate composite score correctly with default weights', () => {
      const scores = {
        mobility: 80,
        businessActivity: 70,
        demographicFit: 90,
        seasonalDemand: 85
      };

      const composite = calculateCompositeScore(scores);

      // Expected: (80*0.30) + (70*0.25) + (90*0.20) + (85*0.25) = 24 + 17.5 + 18 + 21.25 = 80.75
      expect(composite).toBe(80.75);
    });

    it('should calculate composite score with custom weights', () => {
      const scores = {
        mobility: 100,
        businessActivity: 50,
        demographicFit: 75,
        seasonalDemand: 25
      };

      const customWeights = {
        mobility: 0.40,
        businessActivity: 0.20,
        demographicFit: 0.30,
        seasonalDemand: 0.10
      };

      const composite = calculateCompositeScore(scores, customWeights);

      // Expected: (100*0.40) + (50*0.20) + (75*0.30) + (25*0.10) = 40 + 10 + 22.5 + 2.5 = 75
      expect(composite).toBe(75);
    });

    it('should throw error for invalid weights', () => {
      const scores = {
        mobility: 80,
        businessActivity: 70,
        demographicFit: 90,
        seasonalDemand: 85
      };

      const invalidWeights = {
        mobility: 0.50,
        businessActivity: 0.50,
        demographicFit: 0.50,
        seasonalDemand: 0.50
      };

      expect(() => calculateCompositeScore(scores, invalidWeights))
        .toThrow('Weights must sum to 1.0');
    });

    it('should handle all zero scores', () => {
      const scores = {
        mobility: 0,
        businessActivity: 0,
        demographicFit: 0,
        seasonalDemand: 0
      };

      const composite = calculateCompositeScore(scores);
      expect(composite).toBe(0);
    });

    it('should handle all perfect scores', () => {
      const scores = {
        mobility: 100,
        businessActivity: 100,
        demographicFit: 100,
        seasonalDemand: 100
      };

      const composite = calculateCompositeScore(scores);
      expect(composite).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const scores = {
        mobility: 66.666,
        businessActivity: 66.666,
        demographicFit: 66.666,
        seasonalDemand: 66.666
      };

      const composite = calculateCompositeScore(scores);
      
      // Check it has at most 2 decimal places
      const decimalPlaces = (composite.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('ZIP_WEIGHTS', () => {
    it('should have all required weight categories', () => {
      expect(ZIP_WEIGHTS).toHaveProperty('mobility');
      expect(ZIP_WEIGHTS).toHaveProperty('businessActivity');
      expect(ZIP_WEIGHTS).toHaveProperty('demographicFit');
      expect(ZIP_WEIGHTS).toHaveProperty('seasonalDemand');
    });

    it('should have weights summing to 1.0', () => {
      const sum = Object.values(ZIP_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have correct default weights', () => {
      expect(ZIP_WEIGHTS.mobility).toBe(0.30);
      expect(ZIP_WEIGHTS.businessActivity).toBe(0.25);
      expect(ZIP_WEIGHTS.demographicFit).toBe(0.20);
      expect(ZIP_WEIGHTS.seasonalDemand).toBe(0.25);
    });
  });

  describe('isValidZipCode', () => {
    it('should return true for valid 5-digit ZIP codes', () => {
      expect(isValidZipCode('10001')).toBe(true);
      expect(isValidZipCode('90210')).toBe(true);
      expect(isValidZipCode('12345')).toBe(true);
    });

    it('should return true for valid ZIP+4 codes', () => {
      expect(isValidZipCode('10001-1234')).toBe(true);
      expect(isValidZipCode('90210-5678')).toBe(true);
    });

    it('should return false for invalid ZIP codes', () => {
      expect(isValidZipCode('1234')).toBe(false);      // Too short
      expect(isValidZipCode('123456')).toBe(false);    // Too long
      expect(isValidZipCode('abcde')).toBe(false);     // Letters
      expect(isValidZipCode('1234a')).toBe(false);     // Mixed
      expect(isValidZipCode('')).toBe(false);          // Empty
      expect(isValidZipCode(null)).toBe(false);        // Null
      expect(isValidZipCode(undefined)).toBe(false);   // Undefined
    });

    it('should return false for ZIP codes with wrong +4 format', () => {
      expect(isValidZipCode('10001-123')).toBe(false);   // +3 instead of +4
      expect(isValidZipCode('10001-12345')).toBe(false); // +5 instead of +4
      expect(isValidZipCode('10001-')).toBe(false);      // Empty +4
      expect(isValidZipCode('10001-abcd')).toBe(false);  // Letters in +4
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary score values', () => {
      const minScores = {
        mobility: 0,
        businessActivity: 0,
        demographicFit: 0,
        seasonalDemand: 0
      };

      const maxScores = {
        mobility: 100,
        businessActivity: 100,
        demographicFit: 100,
        seasonalDemand: 100
      };

      expect(calculateCompositeScore(minScores)).toBe(0);
      expect(calculateCompositeScore(maxScores)).toBe(100);
    });

    it('should handle single factor dominance', () => {
      const mobilityDominant = {
        mobility: 100,
        businessActivity: 0,
        demographicFit: 0,
        seasonalDemand: 0
      };

      // With default weights, mobility is 30%, so max contribution is 30
      const composite = calculateCompositeScore(mobilityDominant);
      expect(composite).toBe(30);
    });
  });
});
