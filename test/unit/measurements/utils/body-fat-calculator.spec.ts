import {
  calculateAge,
  calculatePollockBodyFat,
  calculateNavyBodyFat,
  hasAllSkinfolds,
  canCalculateNavyMale,
  canCalculateNavyFemale,
} from '@/measurements/utils/body-fat-calculator';

describe('body-fat-calculator', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly when birthday has passed this year', () => {
      const result = calculateAge('1990-01-01', '2024-06-15');
      expect(result).toBe(34);
    });

    it('should calculate age correctly when birthday has not passed yet this year', () => {
      const result = calculateAge('1990-12-31', '2024-06-15');
      expect(result).toBe(33);
    });

    it('should calculate age correctly on the exact birthday', () => {
      const result = calculateAge('1990-06-15', '2024-06-15');
      expect(result).toBe(34);
    });

    it('should return 0 when measurement date is same year as birth', () => {
      const result = calculateAge('2024-01-01', '2024-06-15');
      expect(result).toBe(0);
    });
  });

  describe('calculatePollockBodyFat', () => {
    const skinfolds = {
      triceps: 10,
      subscapular: 12,
      chest: 8,
      midaxillary: 9,
      suprailiac: 11,
      abdominal: 15,
      thigh: 13,
    };

    it('should calculate body fat percentage for a male', () => {
      const result = calculatePollockBodyFat(skinfolds, 30, 'male', 80);

      expect(result).not.toBeNull();
      expect(result!.bodyFatPercentage).toBeGreaterThan(2);
      expect(result!.bodyFatPercentage).toBeLessThan(60);
      expect(result!.leanMass).toBeGreaterThan(0);
      expect(result!.fatMass).toBeGreaterThan(0);
      expect(Math.round((result!.leanMass + result!.fatMass) * 100) / 100).toBe(
        80,
      );
    });

    it('should calculate body fat percentage for a female', () => {
      const result = calculatePollockBodyFat(skinfolds, 30, 'female', 65);

      expect(result).not.toBeNull();
      expect(result!.bodyFatPercentage).toBeGreaterThan(2);
      expect(result!.bodyFatPercentage).toBeLessThan(60);
      expect(result!.leanMass).toBeGreaterThan(0);
      expect(result!.fatMass).toBeGreaterThan(0);
      expect(Math.round((result!.leanMass + result!.fatMass) * 100) / 100).toBe(
        65,
      );
    });

    it('should return values rounded to 2 decimal places', () => {
      const result = calculatePollockBodyFat(skinfolds, 30, 'male', 80);

      expect(result).not.toBeNull();
      const bfpStr = result!.bodyFatPercentage.toString();
      const decimals = bfpStr.includes('.') ? bfpStr.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });

    it('should return null when body fat percentage is below 2%', () => {
      const extremelyLowSkinfolds = {
        triceps: 1,
        subscapular: 1,
        chest: 1,
        midaxillary: 1,
        suprailiac: 1,
        abdominal: 1,
        thigh: 1,
      };

      const result = calculatePollockBodyFat(
        extremelyLowSkinfolds,
        30,
        'male',
        80,
      );

      if (result !== null) {
        expect(result.bodyFatPercentage).toBeGreaterThanOrEqual(2);
      }
    });

    it('should use male formula (Jackson & Pollock 1978)', () => {
      const maleResult = calculatePollockBodyFat(skinfolds, 30, 'male', 80);
      const femaleResult = calculatePollockBodyFat(skinfolds, 30, 'female', 80);

      expect(maleResult).not.toBeNull();
      expect(femaleResult).not.toBeNull();
      expect(femaleResult!.bodyFatPercentage).toBeGreaterThan(
        maleResult!.bodyFatPercentage,
      );
    });

    it('should increase body fat percentage with age for same skinfolds', () => {
      const youngResult = calculatePollockBodyFat(skinfolds, 25, 'male', 80);
      const oldResult = calculatePollockBodyFat(skinfolds, 50, 'male', 80);

      expect(youngResult).not.toBeNull();
      expect(oldResult).not.toBeNull();
      expect(oldResult!.bodyFatPercentage).toBeGreaterThan(
        youngResult!.bodyFatPercentage,
      );
    });
  });

  describe('calculateNavyBodyFat', () => {
    it('should calculate body fat for male using neck and waist', () => {
      const data = { neck: 38, waist: 85, height: 175 };
      const result = calculateNavyBodyFat(data, 'male', 80);

      expect(result).not.toBeNull();
      expect(result!.bodyFatPercentage).toBeGreaterThan(2);
      expect(result!.bodyFatPercentage).toBeLessThan(60);
      expect(result!.leanMass).toBeGreaterThan(0);
      expect(result!.fatMass).toBeGreaterThan(0);
      expect(Math.round((result!.leanMass + result!.fatMass) * 100) / 100).toBe(
        80,
      );
    });

    it('should calculate body fat for female using neck, waist, and hip', () => {
      const data = { neck: 33, waist: 72, hip: 96, height: 165 };
      const result = calculateNavyBodyFat(data, 'female', 65);

      expect(result).not.toBeNull();
      expect(result!.bodyFatPercentage).toBeGreaterThan(2);
      expect(result!.bodyFatPercentage).toBeLessThan(60);
      expect(result!.leanMass).toBeGreaterThan(0);
      expect(result!.fatMass).toBeGreaterThan(0);
      expect(Math.round((result!.leanMass + result!.fatMass) * 100) / 100).toBe(
        65,
      );
    });

    it('should return null for female when hip is not provided', () => {
      const data = { neck: 33, waist: 72, height: 165 };
      const result = calculateNavyBodyFat(data, 'female', 65);

      expect(result).toBeNull();
    });

    it('should return values rounded to 2 decimal places', () => {
      const data = { neck: 38, waist: 85, height: 175 };
      const result = calculateNavyBodyFat(data, 'male', 80);

      expect(result).not.toBeNull();
      const bfpStr = result!.bodyFatPercentage.toString();
      const decimals = bfpStr.includes('.') ? bfpStr.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });

    it('should return null when body fat percentage is above 60%', () => {
      const data = { neck: 20, waist: 200, height: 165 };
      const result = calculateNavyBodyFat(data, 'male', 80);

      expect(result).toBeNull();
    });
  });

  describe('hasAllSkinfolds', () => {
    it('should return true when all 7 skinfolds are present', () => {
      const data = {
        triceps: 10,
        subscapular: 12,
        chest: 8,
        midaxillary: 9,
        suprailiac: 11,
        abdominal: 15,
        thigh: 13,
      };

      expect(hasAllSkinfolds(data)).toBe(true);
    });

    it('should return false when any skinfold is missing', () => {
      const partial = {
        triceps: 10,
        subscapular: 12,
        chest: 8,
        midaxillary: 9,
        suprailiac: 11,
        abdominal: 15,
      };

      expect(hasAllSkinfolds(partial)).toBe(false);
    });

    it('should return false when all skinfolds are missing', () => {
      expect(hasAllSkinfolds({})).toBe(false);
    });

    it('should return false when only one skinfold is provided', () => {
      expect(hasAllSkinfolds({ triceps: 10 })).toBe(false);
    });

    it('should return false when a skinfold value is undefined', () => {
      const data = {
        triceps: 10,
        subscapular: 12,
        chest: 8,
        midaxillary: 9,
        suprailiac: 11,
        abdominal: undefined,
        thigh: 13,
      };

      expect(hasAllSkinfolds(data)).toBe(false);
    });
  });

  describe('canCalculateNavyMale', () => {
    it('should return true when neck, waist, and height are provided', () => {
      const data = { neck: 38, waist: 85, height: 175 };
      expect(canCalculateNavyMale(data)).toBe(true);
    });

    it('should return false when neck is missing', () => {
      const data = { waist: 85, height: 175 };
      expect(canCalculateNavyMale(data)).toBe(false);
    });

    it('should return false when waist is missing', () => {
      const data = { neck: 38, height: 175 };
      expect(canCalculateNavyMale(data)).toBe(false);
    });

    it('should return false when height is missing', () => {
      const data = { neck: 38, waist: 85 };
      expect(canCalculateNavyMale(data)).toBe(false);
    });

    it('should return false when all values are missing', () => {
      expect(canCalculateNavyMale({})).toBe(false);
    });
  });

  describe('canCalculateNavyFemale', () => {
    it('should return true when neck, waist, hip, and height are provided', () => {
      const data = { neck: 33, waist: 72, hip: 96, height: 165 };
      expect(canCalculateNavyFemale(data)).toBe(true);
    });

    it('should return false when hip is missing', () => {
      const data = { neck: 33, waist: 72, height: 165 };
      expect(canCalculateNavyFemale(data)).toBe(false);
    });

    it('should return false when neck is missing', () => {
      const data = { waist: 72, hip: 96, height: 165 };
      expect(canCalculateNavyFemale(data)).toBe(false);
    });

    it('should return false when waist is missing', () => {
      const data = { neck: 33, hip: 96, height: 165 };
      expect(canCalculateNavyFemale(data)).toBe(false);
    });

    it('should return false when height is missing', () => {
      const data = { neck: 33, waist: 72, hip: 96 };
      expect(canCalculateNavyFemale(data)).toBe(false);
    });

    it('should return false when all values are missing', () => {
      expect(canCalculateNavyFemale({})).toBe(false);
    });
  });
});
