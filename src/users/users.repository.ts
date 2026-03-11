import { Injectable, Inject } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { users } from '@/database/schema';
import type { User, CreateUserData, UpdateUserData } from './types/users.types';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findConflictingUser(
    email: string,
    nickname: string,
  ): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.nickname, nickname)));

    return user ?? null;
  }

  async findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db

      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ?? null;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.nickname, nickname));
    return user ?? null;
  }

  async findByEmailOrNickname(login: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, login), eq(users.nickname, login)));

    return user ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
