import { AgeRangeConstraint } from '@/common/validators/age-range.validator';
import type { ValidationArguments } from 'class-validator';

const makeArgs = (min: number, max: number): ValidationArguments =>
  ({ constraints: [min, max] }) as ValidationArguments;

// Returns a local YYYY-MM-DD string for someone born `age` years ago (± daysOffset days).
// Uses local getters to avoid toISOString() UTC shift in timezones behind UTC.
// Use daysOffset ≥ 2 or ≤ -2 for boundary cases to absorb the potential 1-day UTC shift.
const birthDateFor = (age: number, daysOffset = 0): string => {
  const now = new Date();
  const d = new Date(
    now.getFullYear() - age,
    now.getMonth(),
    now.getDate() + daysOffset,
  );
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

describe('AgeRangeConstraint', () => {
  let validator: AgeRangeConstraint;

  beforeEach(() => {
    validator = new AgeRangeConstraint();
  });

  describe('validate', () => {
    it('should return false for an invalid date string', () => {
      expect(validator.validate('not-a-date', makeArgs(18, 99))).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(validator.validate('', makeArgs(18, 99))).toBe(false);
    });

    it('should return true when age is within range', () => {
      expect(validator.validate(birthDateFor(25), makeArgs(18, 99))).toBe(true);
    });

    it('should return true when age is exactly at the minimum', () => {
      // Birthday 2 days ago → clearly passed this year → age = 18
      expect(validator.validate(birthDateFor(18, -2), makeArgs(18, 99))).toBe(
        true,
      );
    });

    it('should return true when age is exactly at the maximum', () => {
      expect(validator.validate(birthDateFor(99), makeArgs(18, 99))).toBe(true);
    });

    it('should return false when age is below the minimum', () => {
      // Clearly 16 years old, well below min of 18
      expect(validator.validate(birthDateFor(16), makeArgs(18, 99))).toBe(
        false,
      );
    });

    it('should return false when age is above the maximum', () => {
      // 100 years old, max is 99
      expect(validator.validate(birthDateFor(100), makeArgs(18, 99))).toBe(
        false,
      );
    });

    it('should return false when birthday is 2 days from now (not yet turned 18)', () => {
      // daysOffset +2: birthday not yet passed → age is still 17
      const result = validator.validate(birthDateFor(18, 2), makeArgs(18, 99));
      expect(result).toBe(false);
    });

    it('should return true when birthday passed 2 days ago (already turned 18)', () => {
      // daysOffset -2: birthday already passed → age is 18
      const result = validator.validate(birthDateFor(18, -2), makeArgs(18, 99));
      expect(result).toBe(true);
    });
  });

  describe('defaultMessage', () => {
    it('should return the correct message with min and max values', () => {
      const message = validator.defaultMessage(makeArgs(18, 99));
      expect(message).toBe('Age must be between 18 and 99 years');
    });

    it('should interpolate custom min and max values', () => {
      const message = validator.defaultMessage(makeArgs(5, 120));
      expect(message).toBe('Age must be between 5 and 120 years');
    });
  });
});
