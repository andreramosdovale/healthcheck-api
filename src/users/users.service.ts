import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { users } from '@/database/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto) {
    if (!createUserDto.termsAccepted) {
      throw new BadRequestException('Terms must be accepted');
    }

    const existing = await this.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, createUserDto.email),
          eq(users.nickname, createUserDto.nickname),
        ),
      );

    if (existing.length > 0) {
      const existingUser = existing[0];
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Nickname already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const [user] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        nickname: createUserDto.nickname,
        passwordHash,
        name: createUserDto.name,
        birthDate: createUserDto.birthDate,
        sex: createUserDto.sex,
        height: createUserDto.height.toString(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      })
      .returning();

    return this.sanitizeUser(user);
  }

  async findAll() {
    const result = await this.db.select().from(users);
    return result.map(this.sanitizeUser);
  }

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user || null;
  }

  async findByNickname(nickname: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.nickname, nickname));

    return user || null;
  }

  async findByEmailOrNickname(login: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, login), eq(users.nickname, login)));

    return user || null;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id);

    const [user] = await this.db
      .update(users)
      .set({
        ...updateUserDto,
        height: updateUserDto.height?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return this.sanitizeUser(user);
  }

  async remove(id: string) {
    await this.findById(id);

    await this.db.delete(users).where(eq(users.id, id));
  }

  private sanitizeUser(user: typeof users.$inferSelect) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
