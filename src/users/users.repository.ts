import { Injectable, Inject } from '@nestjs/common';
import { eq, or, ilike, desc } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { users, roles, userRoles } from '@/database/schema';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  ListUsersInput,
} from './types/users.types';

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

  async findAll(input: ListUsersInput): Promise<User[]> {
    const { limit = 20, offset = 0, search } = input;

    const baseQuery = this.db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    if (search) {
      const term = `%${search}%`;
      return baseQuery.where(
        or(
          ilike(users.name, term),
          ilike(users.email, term),
          ilike(users.nickname, term),
        ),
      );
    }

    return baseQuery;
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

  async assignDefaultRole(userId: string): Promise<void> {
    const [role] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'user'));

    if (role) {
      await this.db.insert(userRoles).values({ userId, roleId: role.id });
    }
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
