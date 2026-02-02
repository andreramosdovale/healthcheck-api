import { pgEnum } from 'drizzle-orm/pg-core';

export const sexEnum = pgEnum('sex', ['male', 'female']);
