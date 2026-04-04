import {
  SKINFOLD_LIMITS,
  WAIST_HIP_CONSISTENCY_MAX_RATIO,
} from '../constants/physiological-limits';

interface SkinfoldInput {
  triceps?: number;
  subscapular?: number;
  chest?: number;
  midaxillary?: number;
  suprailiac?: number;
  abdominal?: number;
  thigh?: number;
}

interface CircumferenceInput {
  waist?: number | null;
  hip?: number | null;
}

export interface PlausibilityViolation {
  field: string;
  reason: string;
}

function validateSkinfoldSum(
  skinfolds: SkinfoldInput,
): PlausibilityViolation | null {
  const values = [
    skinfolds.triceps,
    skinfolds.subscapular,
    skinfolds.chest,
    skinfolds.midaxillary,
    skinfolds.suprailiac,
    skinfolds.abdominal,
    skinfolds.thigh,
  ];

  if (values.some((v) => v == null)) return null;

  const sum = (values as number[]).reduce((acc, v) => acc + v, 0);

  if (sum < SKINFOLD_LIMITS.sumMin || sum > SKINFOLD_LIMITS.sumMax) {
    return {
      field: 'skinfoldSum',
      reason: `Sum of all 7 skinfolds must be between ${SKINFOLD_LIMITS.sumMin} mm and ${SKINFOLD_LIMITS.sumMax} mm (got ${Math.round(sum)} mm)`,
    };
  }

  return null;
}

function validateWaistHipConsistency(
  circ: CircumferenceInput,
): PlausibilityViolation | null {
  const { waist, hip } = circ;

  if (waist == null || hip == null) return null;

  if (waist / hip > WAIST_HIP_CONSISTENCY_MAX_RATIO) {
    return {
      field: 'waistHipConsistency',
      reason: `Waist (${waist} cm) is implausibly large relative to hip (${hip} cm). Ratio must not exceed ${WAIST_HIP_CONSISTENCY_MAX_RATIO}`,
    };
  }

  return null;
}

export function validateMeasurementPlausibility(
  input: SkinfoldInput & CircumferenceInput,
): PlausibilityViolation[] {
  const violations: PlausibilityViolation[] = [];

  const skinfoldViolation = validateSkinfoldSum(input);
  if (skinfoldViolation) violations.push(skinfoldViolation);

  const whrViolation = validateWaistHipConsistency(input);
  if (whrViolation) violations.push(whrViolation);

  return violations;
}
