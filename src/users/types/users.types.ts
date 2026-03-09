import { users } from '@/database/schema';

export type User = typeof users.$inferSelect;
export type SanitizedUser = Omit<User, 'passwordHash'>;

export interface CreateUserData {
  email: string;
  nickname: string;
  passwordHash: string;
  name: string;
  birthDate: string;
  sex: 'male' | 'female';
  height: string;
  termsAccepted: boolean;
  termsAcceptedAt: Date;
}

export interface UpdateUserData {
  name?: string;
  height?: string;
  updatedAt: Date;
}
