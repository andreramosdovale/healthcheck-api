import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '@/auth/auth.service';
import { UsersService } from '@/users/users.service';
import { DRIZZLE } from '@/database/drizzle.module';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { makeUser, makeSanitizedUser } from '@test/stubs/user.stub';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-refresh-token'),
  }),
}));

type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
};

type MockUsersService = {
  create: jest.Mock;
  findByEmailOrNickname: jest.Mock;
  findById: jest.Mock;
};

type MockJwtService = {
  sign: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockUsersService;
  let jwtService: MockJwtService;
  let mockDb: MockDb;

  const mockUser = makeUser();
  const mockUserWithoutPassword = makeSanitizedUser();

  const createUserDto: CreateUserDto = {
    email: 'test@example.com',
    nickname: 'testuser',
    password: 'Test@1234',
    name: 'Test User',
    birthDate: '1990-01-01',
    sex: 'male',
    height: 175,
    termsAccepted: true,
  };

  const loginDto: LoginDto = {
    login: 'test@example.com',
    password: 'Test@1234',
  };

  const mockRefreshToken = {
    id: '1',
    userId: mockUser.id,
    token: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };

    usersService = {
      create: jest.fn(),
      findByEmailOrNickname: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      usersService.create.mockResolvedValue(mockUserWithoutPassword);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully and return user with tokens', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(usersService.findByEmailOrNickname).toHaveBeenCalledWith(
        loginDto.login,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = makeUser({ isActive: false });
      usersService.findByEmailOrNickname.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('User is inactive');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      usersService.findById.mockResolvedValue(mockUserWithoutPassword);

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      const result = await service.refresh('mock-refresh-token');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(usersService.findById).toHaveBeenCalledWith(
        mockRefreshToken.userId,
      );
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should throw UnauthorizedException if refresh token is revoked', async () => {
      const revokedToken = { ...mockRefreshToken, revokedAt: new Date() };
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([revokedToken]),
      });

      await expect(service.refresh('revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = makeSanitizedUser({ isActive: false });

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      usersService.findById.mockResolvedValue(inactiveUser);

      await expect(service.refresh('mock-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh('mock-refresh-token')).rejects.toThrow(
        'User not found or inactive',
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      const result = await service.logout('mock-refresh-token');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('calculateExpiration', () => {
    type AuthServicePrivate = {
      calculateExpiration: (expiresIn: string) => Date;
    };

    it('should calculate expiration for seconds', () => {
      const result = (
        service as unknown as AuthServicePrivate
      ).calculateExpiration('60s');
      const now = new Date();
      const expected = new Date(now.getTime() + 60 * 1000);

      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should calculate expiration for minutes', () => {
      const result = (
        service as unknown as AuthServicePrivate
      ).calculateExpiration('30m');
      const now = new Date();
      const expected = new Date(now.getTime() + 30 * 60 * 1000);

      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should calculate expiration for hours', () => {
      const result = (
        service as unknown as AuthServicePrivate
      ).calculateExpiration('2h');
      const now = new Date();
      const expected = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should calculate expiration for days', () => {
      const result = (
        service as unknown as AuthServicePrivate
      ).calculateExpiration('7d');
      const now = new Date();
      const expected = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should default to 7 days for invalid format', () => {
      const result = (
        service as unknown as AuthServicePrivate
      ).calculateExpiration('invalid');
      const now = new Date();
      const expected = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });
  });
});
