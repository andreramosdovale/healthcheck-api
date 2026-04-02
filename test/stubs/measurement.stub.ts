import type {
  Measurement,
  UserForMeasurement,
  MeasurementResponse,
  CreateMeasurementInput,
  ListMeasurementsInput,
} from '@/measurements/types/measurements.types';
import { USER_ID } from '@test/stubs/user.stub';

export { USER_ID };
export const MEASUREMENT_ID = '223e4567-e89b-12d3-a456-426614174001';

// Raw DB row — used to mock the repository layer
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

// Shaped API response — used to assert what the service returns
export const makeMeasurementResponse = (
  overrides?: Partial<MeasurementResponse>,
): MeasurementResponse => ({
  id: MEASUREMENT_ID,
  userId: USER_ID,
  measurementDate: '2024-01-15',
  weight: 80,
  skinfolds: null,
  circumferences: null,
  calculated: {
    bodyFatPercentage: null,
    bodyFatMethod: null,
    leanMass: null,
    fatMass: null,
    leanMassPercentage: null,
    waistHipRatio: null,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
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

export const makeCreateMeasurementInput = (
  overrides?: Partial<CreateMeasurementInput>,
): CreateMeasurementInput => ({
  measurementDate: '2024-01-15',
  weight: 80,
  ...overrides,
});

export const makeListMeasurementsInput = (
  overrides?: Partial<ListMeasurementsInput>,
): ListMeasurementsInput => ({
  limit: 20,
  offset: 0,
  ...overrides,
});
