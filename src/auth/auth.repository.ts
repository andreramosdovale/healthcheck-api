import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { refreshTokens } from '@/database/schema';
import type { RefreshToken } from './types/auth.types';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findValidToken(token: string): Promise<RefreshToken | null> {
    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      );

    return storedToken ?? null;
  }

  async revokeById(id: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token));

    return storedToken ?? null;
  }

  async revokeByToken(token: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, token));
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.db.insert(refreshTokens).values({ userId, token, expiresAt });
  }
}
