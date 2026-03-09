import type { Measurement } from '@/measurements/types/measurements.types';

export interface SummaryPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null;
  navyBodyFatPercentage: number | null;
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
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  message: string;
}
