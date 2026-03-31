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

export type DeltaDirection = 'up' | 'down' | 'stable' | null;

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

export interface DeltaFields {
  weight: DeltaDirection;
  bodyFatPercentage: DeltaDirection;
  leanMass: DeltaDirection;
  fatMass: DeltaDirection;
  // skinfolds — individual fields + aggregate sum
  triceps: DeltaDirection;
  subscapular: DeltaDirection;
  chest: DeltaDirection;
  midaxillary: DeltaDirection;
  suprailiac: DeltaDirection;
  abdominal: DeltaDirection;
  thigh: DeltaDirection;
  skinfoldSum: DeltaDirection;
  // circumferences
  neck: DeltaDirection;
  waist: DeltaDirection;
  hip: DeltaDirection;
  shoulders: DeltaDirection;
  chestCirc: DeltaDirection;
  leftThigh: DeltaDirection;
  rightThigh: DeltaDirection;
  leftCalf: DeltaDirection;
  rightCalf: DeltaDirection;
  leftBicepRelaxed: DeltaDirection;
  rightBicepRelaxed: DeltaDirection;
  leftBicepFlexed: DeltaDirection;
  rightBicepFlexed: DeltaDirection;
}

export interface DeltaResult {
  measurementId: string;
  previousMeasurementId: string | null;
  delta: DeltaFields | null;
}
