import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  boolean,
} from 'drizzle-orm/pg-core';
import { planEnum } from './plan-enum';
import { sexEnum } from './sex-enum';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  email: varchar('email', { length: 256 }).notNull().unique(),
  nickname: varchar('nickname', { length: 30 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  name: varchar('name', { length: 100 }).notNull(),
  birthDate: date('birth_date').notNull(),
  sex: sexEnum('sex').notNull(),
  height: decimal('height', { precision: 5, scale: 2 }).notNull(),

  plan: planEnum('plan').default('free').notNull(),

  isActive: boolean('is_active').default(true).notNull(),

  termsAccepted: boolean('terms_accepted').default(false).notNull(),
  termsAcceptedAt: timestamp('terms_accepted_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
