/**
 * Waist-Hip Ratio (WHR) — Razão Cintura-Quadril
 *
 * Reference:
 *   WHO (2008). Waist Circumference and Waist-Hip Ratio:
 *   Report of a WHO Expert Consultation. Geneva, 8–11 December 2008.
 *   ISBN 978 92 4 150149 1.
 */

export type WhrRisk = 'low' | 'moderate' | 'high';

export interface WaistHipRatioResult {
  value: number;
  risk: WhrRisk | null;
}

const WHR_THRESHOLDS = {
  male: { low: 0.9, high: 1.0 },
  female: { low: 0.8, high: 0.85 },
} as const;

function classifyRisk(value: number, sex: 'male' | 'female'): WhrRisk {
  const { low, high } = WHR_THRESHOLDS[sex];
  if (value < low) return 'low';
  if (value < high) return 'moderate';
  return 'high';
}

export function calculateWaistHipRatio(
  waist: number,
  hip: number,
  sex?: 'male' | 'female' | null,
): WaistHipRatioResult {
  const value = Math.round((waist / hip) * 100) / 100;
  const risk = sex ? classifyRisk(value, sex) : null;
  return { value, risk };
}
