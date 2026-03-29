import type { Measurement } from '@/measurements/types/measurements.types';

export type TrendCode =
  | 'first_measurement'
  | 'excellent_progress'
  | 'good_progress'
  | 'fat_increased'
  | 'stable_results'
  | 'weight_loss'
  | 'weight_gain'
  | 'weight_stable';

export interface GetSummaryInput {
  limit: number;
  from?: string;
  to?: string;
}

export interface SummaryPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null;
  bodyFatMethod: 'pollock' | 'navy' | null;
  leanMass: number | null;
  fatMass: number | null;
}

export interface CompareResult {
  from: Measurement;
  to: Measurement;
  diff: {
    days: number;
    weight: number;
    bodyFatPercentage: number | null;
    leanMass: number | null;
    fatMass: number | null;
  };
}

export interface LatestResult {
  current: Measurement;
  previous: Measurement | null;
  trend: 'improving' | 'stable' | 'worsening' | null;
  trendCode: TrendCode | null;
}
