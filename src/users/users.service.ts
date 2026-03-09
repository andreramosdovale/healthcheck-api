import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import type { User, SanitizedUser } from './types/users.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<SanitizedUser> {
    if (!createUserDto.termsAccepted) {
      throw new BadRequestException('Terms must be accepted');
    }

    const existing = await this.usersRepository.findConflictingUser(
      createUserDto.email,
      createUserDto.nickname,
    );

    if (existing) {
      if (existing.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Nickname already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const user = await this.usersRepository.create({
      email: createUserDto.email,
      nickname: createUserDto.nickname,
      passwordHash,
      name: createUserDto.name,
      birthDate: createUserDto.birthDate,
      sex: createUserDto.sex,
      height: createUserDto.height.toString(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    return this.sanitizeUser(user);
  }

  async findAll(): Promise<SanitizedUser[]> {
    const result = await this.usersRepository.findAll();
    return result.map((user) => this.sanitizeUser(user));
  }

  async findById(id: string): Promise<SanitizedUser> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<SanitizedUser> {
    await this.findById(id);

    const user = await this.usersRepository.update(id, {
      ...updateUserDto,
      height: updateUserDto.height?.toString(),
      updatedAt: new Date(),
    });

    return this.sanitizeUser(user);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }

  private sanitizeUser(user: User): SanitizedUser {
    const { ...sanitized } = user;
    return sanitized;
  }
}
