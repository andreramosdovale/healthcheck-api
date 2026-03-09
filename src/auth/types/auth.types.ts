import { refreshTokens } from '@/database/schema';

export type RefreshToken = typeof refreshTokens.$inferSelect;
