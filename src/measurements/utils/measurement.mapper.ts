import type { Measurement, MeasurementResponse } from '../types/measurements.types';
import { calculateWaistHipRatio } from './waist-hip-ratio';

const SKINFOLD_FIELDS = [
  'triceps',
  'subscapular',
  'chest',
  'midaxillary',
  'suprailiac',
  'abdominal',
  'thigh',
] as const;

const CIRCUMFERENCE_FIELDS = [
  'neck',
  'waist',
  'hip',
  'shoulders',
  'chestCirc',
  'leftThigh',
  'rightThigh',
  'leftCalf',
  'rightCalf',
  'leftBicepRelaxed',
  'rightBicepRelaxed',
  'leftBicepFlexed',
  'rightBicepFlexed',
] as const;

function parseOrNull(value: string | null): number | null {
  return value !== null ? parseFloat(value) : null;
}

export function toMeasurementResponse(
  row: Measurement,
  sex?: 'male' | 'female' | null,
): MeasurementResponse {
  const pollock = parseOrNull(row.bodyFatPercentage);
  const navy = parseOrNull(row.navyBodyFatPercentage);

  const bodyFatPercentage = pollock ?? navy;
  const bodyFatMethod =
    pollock !== null ? 'pollock' : navy !== null ? 'navy' : null;

  const leanMassPercentage =
    bodyFatPercentage !== null
      ? Math.round((100 - bodyFatPercentage) * 100) / 100
      : null;

  const waist = parseOrNull(row.waist);
  const hip = parseOrNull(row.hip);
  const waistHipRatio =
    waist !== null && hip !== null
      ? calculateWaistHipRatio(waist, hip, sex)
      : null;

  const allSkinfoldNull = SKINFOLD_FIELDS.every((f) => row[f] === null);
  const skinfolds = allSkinfoldNull
    ? null
    : {
        triceps: parseFloat(row.triceps!),
        subscapular: parseFloat(row.subscapular!),
        chest: parseFloat(row.chest!),
        midaxillary: parseFloat(row.midaxillary!),
        suprailiac: parseFloat(row.suprailiac!),
        abdominal: parseFloat(row.abdominal!),
        thigh: parseFloat(row.thigh!),
      };

  const allCircumferenceNull = CIRCUMFERENCE_FIELDS.every(
    (f) => row[f] === null,
  );
  const circumferences = allCircumferenceNull
    ? null
    : {
        neck: parseOrNull(row.neck),
        waist,
        hip,
        shoulders: parseOrNull(row.shoulders),
        chestCirc: parseOrNull(row.chestCirc),
        leftThigh: parseOrNull(row.leftThigh),
        rightThigh: parseOrNull(row.rightThigh),
        leftCalf: parseOrNull(row.leftCalf),
        rightCalf: parseOrNull(row.rightCalf),
        leftBicepRelaxed: parseOrNull(row.leftBicepRelaxed),
        rightBicepRelaxed: parseOrNull(row.rightBicepRelaxed),
        leftBicepFlexed: parseOrNull(row.leftBicepFlexed),
        rightBicepFlexed: parseOrNull(row.rightBicepFlexed),
      };

  return {
    id: row.id,
    userId: row.userId,
    measurementDate: row.measurementDate,
    weight: parseFloat(row.weight),
    skinfolds,
    circumferences,
    calculated: {
      bodyFatPercentage,
      bodyFatMethod,
      leanMass: parseOrNull(row.leanMass),
      fatMass: parseOrNull(row.fatMass),
      leanMassPercentage,
      waistHipRatio,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}
