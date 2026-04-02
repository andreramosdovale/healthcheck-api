import { measurements } from '@/database/schema';

export type Measurement = typeof measurements.$inferSelect;

export interface UserForMeasurement {
  birthDate: string;
  sex: 'male' | 'female';
  height: string;
}

export type MeasurementInsertData = typeof measurements.$inferInsert;

export type MeasurementUpdateData = Partial<
  Omit<typeof measurements.$inferInsert, 'id' | 'userId' | 'createdAt'>
> & { updatedAt: Date };

// Input types (usados pelo service, nunca pelos DTOs)
export interface CreateMeasurementInput {
  measurementDate: string;
  weight: number;
  triceps?: number;
  subscapular?: number;
  chest?: number;
  midaxillary?: number;
  suprailiac?: number;
  abdominal?: number;
  thigh?: number;
  neck?: number | null;
  waist?: number | null;
  hip?: number | null;
  shoulders?: number | null;
  chestCirc?: number | null;
  leftThigh?: number | null;
  rightThigh?: number | null;
  leftCalf?: number | null;
  rightCalf?: number | null;
  leftBicepRelaxed?: number | null;
  rightBicepRelaxed?: number | null;
  leftBicepFlexed?: number | null;
  rightBicepFlexed?: number | null;
}

export type UpdateMeasurementInput = Partial<CreateMeasurementInput>;

export interface ListMeasurementsInput {
  limit: number;
  offset: number;
  from?: string;
  to?: string;
}

export interface WaistHipRatio {
  value: number;
  risk: 'low' | 'moderate' | 'high' | null;
}

// Response type (retornado pela API)
export interface MeasurementResponse {
  id: string;
  userId: string;
  measurementDate: string;
  weight: number;
  skinfolds: {
    triceps: number;
    subscapular: number;
    chest: number;
    midaxillary: number;
    suprailiac: number;
    abdominal: number;
    thigh: number;
  } | null;
  circumferences: {
    neck: number | null;
    waist: number | null;
    hip: number | null;
    shoulders: number | null;
    chestCirc: number | null;
    leftThigh: number | null;
    rightThigh: number | null;
    leftCalf: number | null;
    rightCalf: number | null;
    leftBicepRelaxed: number | null;
    rightBicepRelaxed: number | null;
    leftBicepFlexed: number | null;
    rightBicepFlexed: number | null;
  } | null;
  calculated: {
    bodyFatPercentage: number | null;
    bodyFatMethod: 'pollock' | 'navy' | null;
    leanMass: number | null;
    fatMass: number | null;
    leanMassPercentage: number | null;
    waistHipRatio: WaistHipRatio | null;
  };
  createdAt: string;
  updatedAt: string | null;
}
