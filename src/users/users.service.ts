import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import type {
  User,
  SanitizedUser,
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
} from './types/users.types';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(input: CreateUserInput): Promise<SanitizedUser> {
    if (!input.termsAccepted) {
      throw new BadRequestException('Terms must be accepted');
    }

    const existing = await this.usersRepository.findConflictingUser(
      input.email,
      input.nickname,
    );

    if (existing) {
      if (existing.email === input.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Nickname already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.usersRepository.create({
      email: input.email,
      nickname: input.nickname,
      passwordHash,
      name: input.name,
      birthDate: input.birthDate,
      sex: input.sex,
      height: input.height.toString(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    await this.usersRepository.assignDefaultRole(user.id);

    return this.sanitizeUser(user);
  }

  async findAll(input: ListUsersInput): Promise<SanitizedUser[]> {
    const result = await this.usersRepository.findAll(input);
    return result.map((user) => this.sanitizeUser(user));
  }

  async findById(id: string): Promise<SanitizedUser> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByIdOrNull(id: string): Promise<SanitizedUser | null> {
    const user = await this.usersRepository.findById(id);
    return user ? this.sanitizeUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.usersRepository.findByNickname(nickname);
  }

  async findByEmailOrNickname(login: string): Promise<User | null> {
    return this.usersRepository.findByEmailOrNickname(login);
  }

  async update(id: string, input: UpdateUserInput): Promise<SanitizedUser> {
    await this.findById(id);

    const user = await this.usersRepository.update(id, {
      name: input.name,
      height: input.height?.toString(),
      updatedAt: new Date(),
    });

    return this.sanitizeUser(user);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }

  private sanitizeUser(user: User): SanitizedUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }
}
