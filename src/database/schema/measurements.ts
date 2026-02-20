import { pgTable, uuid, date, decimal, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const measurements = pgTable('measurements', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  measurementDate: date('measurement_date').notNull(),

  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),

  triceps: decimal('triceps', { precision: 5, scale: 2 }),
  subscapular: decimal('subscapular', { precision: 5, scale: 2 }),
  chest: decimal('chest', { precision: 5, scale: 2 }),
  midaxillary: decimal('midaxillary', { precision: 5, scale: 2 }),
  suprailiac: decimal('suprailiac', { precision: 5, scale: 2 }),
  abdominal: decimal('abdominal', { precision: 5, scale: 2 }),
  thigh: decimal('thigh', { precision: 5, scale: 2 }),

  neck: decimal('neck', { precision: 5, scale: 2 }),
  shoulders: decimal('shoulders', { precision: 5, scale: 2 }),
  chestCirc: decimal('chest_circ', { precision: 5, scale: 2 }),
  waist: decimal('waist', { precision: 5, scale: 2 }),
  hip: decimal('hip', { precision: 5, scale: 2 }),
  leftThigh: decimal('left_thigh', { precision: 5, scale: 2 }),
  rightThigh: decimal('right_thigh', { precision: 5, scale: 2 }),
  leftCalf: decimal('left_calf', { precision: 5, scale: 2 }),
  rightCalf: decimal('right_calf', { precision: 5, scale: 2 }),
  leftBicepRelaxed: decimal('left_bicep_relaxed', { precision: 5, scale: 2 }),
  rightBicepRelaxed: decimal('right_bicep_relaxed', { precision: 5, scale: 2 }),
  leftBicepFlexed: decimal('left_bicep_flexed', { precision: 5, scale: 2 }),
  rightBicepFlexed: decimal('right_bicep_flexed', { precision: 5, scale: 2 }),

  bodyFatPercentage: decimal('body_fat_percentage', { precision: 5, scale: 2 }),
  navyBodyFatPercentage: decimal('navy_body_fat_percentage', {
    precision: 5,
    scale: 2,
  }),
  leanMass: decimal('lean_mass', { precision: 5, scale: 2 }),
  fatMass: decimal('fat_mass', { precision: 5, scale: 2 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

export type Measurement = typeof measurements.$inferSelect;
export type NewMeasurement = typeof measurements.$inferInsert;
