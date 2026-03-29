import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { UsersService } from '../users/users.service';
import type { CreateUserInput, SanitizedUser } from '@/users/types/users.types';
import type { JwtPayload, LoginInput } from './types/auth.types';

type TokenPair = { accessToken: string; refreshToken: string };
type AuthResponse = { user: SanitizedUser } & TokenPair;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: CreateUserInput): Promise<AuthResponse> {
    const user = await this.usersService.create(input);
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailOrNickname(input.login);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash: _, ...sanitizedUser } = user;
    const tokens = await this.generateTokens(sanitizedUser);

    return { user: sanitizedUser, ...tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const storedToken = await this.authRepository.findValidToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findByIdOrNull(storedToken.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.authRepository.revokeById(storedToken.id);

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const token = await this.authRepository.findByToken(refreshToken);

    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.authRepository.revokeById(token.id);
  }

  private async generateTokens(user: SanitizedUser): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpiration(expiresIn);

    await this.authRepository.create(userId, token, expiresAt);

    return token;
  }

  private calculateExpiration(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
