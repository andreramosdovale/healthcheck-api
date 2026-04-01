import type { RefreshToken } from '@/auth/types/auth.types';
import type { LoginInput } from '@/auth/types/auth.types';
import { USER_ID } from '@test/stubs/user.stub';

export const REFRESH_TOKEN_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567890';
export const REFRESH_TOKEN_VALUE = 'mock-refresh-token';

export const makeRefreshToken = (overrides?: Partial<RefreshToken>): RefreshToken => ({
  id: REFRESH_TOKEN_ID,
  userId: USER_ID,
  token: REFRESH_TOKEN_VALUE,
  expiresAt: new Date('2099-01-01'),
  revokedAt: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeLoginInput = (overrides?: Partial<LoginInput>): LoginInput => ({
  login: 'test@example.com',
  password: 'Test@1234',
  ...overrides,
});
