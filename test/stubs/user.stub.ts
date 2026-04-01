import type {
  User,
  SanitizedUser,
  CreateUserInput,
  UpdateUserInput,
} from '@/users/types/users.types';

export const USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export const makeUser = (overrides?: Partial<User>): User => ({
  id: USER_ID,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...sanitized } = makeUser();
  return { ...sanitized, ...overrides };
};

export const makeCreateUserInput = (
  overrides?: Partial<CreateUserInput>,
): CreateUserInput => ({
  email: 'test@example.com',
  nickname: 'testuser',
  password: 'Test@1234',
  name: 'Test User',
  birthDate: '1990-01-01',
  sex: 'male',
  height: 175,
  termsAccepted: true,
  ...overrides,
});

export const makeUpdateUserInput = (
  overrides?: Partial<UpdateUserInput>,
): UpdateUserInput => ({
  name: 'Updated Name',
  height: 180,
  ...overrides,
});
