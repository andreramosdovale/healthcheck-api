import { calculateWaistHipRatio } from '@/common/utils/waist-hip-ratio';

describe('calculateWaistHipRatio', () => {
  it('should return the ratio rounded to 2 decimal places', () => {
    // 85 / 90 = 0.9444... → 0.94
    const result = calculateWaistHipRatio(85, 90, 'male');
    expect(result.value).toBe(0.94);
  });

  it('should return risk null when sex is not provided', () => {
    const result = calculateWaistHipRatio(80, 100);
    expect(result.value).toBe(0.8);
    expect(result.risk).toBeNull();
  });

  it('should return risk null when sex is null', () => {
    const result = calculateWaistHipRatio(80, 100, null);
    expect(result.risk).toBeNull();
  });

  describe('male thresholds (low < 0.90, moderate 0.90–0.99, high ≥ 1.00)', () => {
    it('should return low risk when value is below 0.90', () => {
      // 80 / 100 = 0.80
      const result = calculateWaistHipRatio(80, 100, 'male');
      expect(result.risk).toBe('low');
    });

    it('should return moderate risk when value is exactly 0.90', () => {
      // 90 / 100 = 0.90
      const result = calculateWaistHipRatio(90, 100, 'male');
      expect(result.risk).toBe('moderate');
    });

    it('should return moderate risk when value is between 0.90 and 0.99', () => {
      // 95 / 100 = 0.95
      const result = calculateWaistHipRatio(95, 100, 'male');
      expect(result.risk).toBe('moderate');
    });

    it('should return high risk when value is exactly 1.00', () => {
      // 100 / 100 = 1.00
      const result = calculateWaistHipRatio(100, 100, 'male');
      expect(result.risk).toBe('high');
    });

    it('should return high risk when value is above 1.00', () => {
      // 110 / 100 = 1.10
      const result = calculateWaistHipRatio(110, 100, 'male');
      expect(result.risk).toBe('high');
    });
  });

  describe('female thresholds (low < 0.80, moderate 0.80–0.85, high > 0.85)', () => {
    it('should return low risk when value is below 0.80', () => {
      // 75 / 100 = 0.75
      const result = calculateWaistHipRatio(75, 100, 'female');
      expect(result.risk).toBe('low');
    });

    it('should return moderate risk when value is exactly 0.80', () => {
      // 80 / 100 = 0.80
      const result = calculateWaistHipRatio(80, 100, 'female');
      expect(result.risk).toBe('moderate');
    });

    it('should return moderate risk when value is between 0.80 and 0.84', () => {
      // 82 / 100 = 0.82
      const result = calculateWaistHipRatio(82, 100, 'female');
      expect(result.risk).toBe('moderate');
    });

    it('should return high risk when value is exactly 0.85', () => {
      // 85 / 100 = 0.85
      const result = calculateWaistHipRatio(85, 100, 'female');
      expect(result.risk).toBe('high');
    });

    it('should return high risk when value is above 0.85', () => {
      // 90 / 100 = 0.90
      const result = calculateWaistHipRatio(90, 100, 'female');
      expect(result.risk).toBe('high');
    });
  });
});
