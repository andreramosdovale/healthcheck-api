import type { User, SanitizedUser } from '@/users/types/users.types';

export const makeUser = (overrides?: Partial<User>): User => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  nickname: 'testuser',
  passwordHash: 'hashedPassword',
  name: 'Test User',
  birthDate: '1990-01-01',
  sex: 'male',
  height: '175',
  plan: 'free',
  isActive: true,
  termsAccepted: true,
  termsAcceptedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  ...overrides,
});

export const makeSanitizedUser = (
  overrides?: Partial<SanitizedUser>,
): SanitizedUser => {
  const { ...sanitized } = makeUser();
  return { ...sanitized, ...overrides };
};
