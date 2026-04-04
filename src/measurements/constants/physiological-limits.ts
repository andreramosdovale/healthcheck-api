export const SKINFOLD_LIMITS = {
  min: 2,
  max: 100,
  sumMin: 20,
  sumMax: 500,
} as const;

export const CIRCUMFERENCE_LIMITS = {
  neck: { min: 25, max: 70 },
  waist: { min: 50, max: 200 },
  hip: { min: 60, max: 200 },
  shoulders: { min: 60, max: 200 },
  chestCirc: { min: 50, max: 200 },
  thigh: { min: 25, max: 100 },
  calf: { min: 20, max: 80 },
  bicep: { min: 15, max: 70 },
} as const;

export const WAIST_HIP_CONSISTENCY_MAX_RATIO = 1.5;
