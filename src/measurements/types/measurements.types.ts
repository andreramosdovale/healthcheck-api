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
