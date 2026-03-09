import type {
  Measurement,
  UserForMeasurement,
} from '@/measurements/types/measurements.types';

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const MEASUREMENT_ID = '223e4567-e89b-12d3-a456-426614174001';

export const makeMeasurement = (
  overrides?: Partial<Measurement>,
): Measurement => ({
  id: MEASUREMENT_ID,
  userId: USER_ID,
  measurementDate: '2024-01-15',
  weight: '80.00',
  triceps: null,
  subscapular: null,
  chest: null,
  midaxillary: null,
  suprailiac: null,
  abdominal: null,
  thigh: null,
  neck: null,
  shoulders: null,
  chestCirc: null,
  waist: null,
  hip: null,
  leftThigh: null,
  rightThigh: null,
  leftCalf: null,
  rightCalf: null,
  leftBicepRelaxed: null,
  rightBicepRelaxed: null,
  leftBicepFlexed: null,
  rightBicepFlexed: null,
  bodyFatPercentage: null,
  navyBodyFatPercentage: null,
  leanMass: null,
  fatMass: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  ...overrides,
});

export const makeUserForMeasurement = (
  overrides?: Partial<UserForMeasurement>,
): UserForMeasurement => ({
  birthDate: '1990-01-01',
  sex: 'male',
  height: '175',
  ...overrides,
});
