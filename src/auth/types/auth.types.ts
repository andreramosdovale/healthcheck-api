import { refreshTokens } from '@/database/schema';

export type RefreshToken = typeof refreshTokens.$inferSelect;

export interface JwtPayload {
  sub: string;
  email: string;
  nickname: string;
}

export interface LoginInput {
  login: string;
  password: string;
}
