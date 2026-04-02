import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '@/auth/auth.service';
import { AuthRepository } from '@/auth/auth.repository';
import { UsersService } from '@/users/users.service';
import {
  makeUser,
  makeSanitizedUser,
  makeCreateUserInput,
} from '@test/stubs/user.stub';
import {
  makeRefreshToken,
  makeLoginInput,
  REFRESH_TOKEN_VALUE,
} from '@test/stubs/auth.stub';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-refresh-token'),
  }),
}));

type MockAuthRepository = {
  findValidToken: jest.Mock;
  findByToken: jest.Mock;
  revokeById: jest.Mock;
  create: jest.Mock;
};

type MockUsersService = {
  create: jest.Mock;
  findByEmailOrNickname: jest.Mock;
  findByIdOrNull: jest.Mock;
};

type MockJwtService = {
  sign: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: MockAuthRepository;
  let usersService: MockUsersService;
  let jwtService: MockJwtService;

  const mockUser = makeUser();
  const mockSanitizedUser = makeSanitizedUser();
  const mockCreateUserInput = makeCreateUserInput();
  const mockLoginInput = makeLoginInput();
  const mockRefreshToken = makeRefreshToken();

  beforeEach(async () => {
    authRepository = {
      findValidToken: jest.fn(),
      findByToken: jest.fn(),
      revokeById: jest.fn(),
      create: jest.fn(),
    };

    usersService = {
      create: jest.fn(),
      findByEmailOrNickname: jest.fn(),
      findByIdOrNull: jest.fn(),
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
        { provide: AuthRepository, useValue: authRepository },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should create user, generate tokens and return them', async () => {
      usersService.create.mockResolvedValue(mockSanitizedUser);
      authRepository.create.mockResolvedValue(undefined);

      const result = await service.register(mockCreateUserInput);

      expect(result).toHaveProperty('user', mockSanitizedUser);
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', REFRESH_TOKEN_VALUE);
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserInput);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockSanitizedUser.id,
        email: mockSanitizedUser.email,
        nickname: mockSanitizedUser.nickname,
      });
    });
  });

  describe('login', () => {
    it('should return sanitized user and tokens when credentials are valid', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      authRepository.create.mockResolvedValue(undefined);

      const result = await service.login(mockLoginInput);

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', REFRESH_TOKEN_VALUE);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(usersService.findByEmailOrNickname).toHaveBeenCalledWith(
        mockLoginInput.login,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginInput.password,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(null);

      await expect(service.login(mockLoginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginInput)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw ForbiddenException when account is inactive', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(
        makeUser({ isActive: false }),
      );

      await expect(service.login(mockLoginInput)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.login(mockLoginInput)).rejects.toThrow(
        'Account is inactive',
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersService.findByEmailOrNickname.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(mockLoginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginInput)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('refresh', () => {
    it('should revoke old token and return a new token pair', async () => {
      authRepository.findValidToken.mockResolvedValue(mockRefreshToken);
      usersService.findByIdOrNull.mockResolvedValue(mockSanitizedUser);
      authRepository.revokeById.mockResolvedValue(undefined);
      authRepository.create.mockResolvedValue(undefined);

      const result = await service.refresh(REFRESH_TOKEN_VALUE);

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', REFRESH_TOKEN_VALUE);
      expect(result).not.toHaveProperty('user');
      expect(authRepository.revokeById).toHaveBeenCalledWith(
        mockRefreshToken.id,
      );
      expect(usersService.findByIdOrNull).toHaveBeenCalledWith(
        mockRefreshToken.userId,
      );
    });

    it('should throw UnauthorizedException when token is not found, expired or revoked', async () => {
      authRepository.findValidToken.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      authRepository.findValidToken.mockResolvedValue(mockRefreshToken);
      usersService.findByIdOrNull.mockResolvedValue(null);

      await expect(service.refresh(REFRESH_TOKEN_VALUE)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(REFRESH_TOKEN_VALUE)).rejects.toThrow(
        'User not found or inactive',
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      authRepository.findValidToken.mockResolvedValue(mockRefreshToken);
      usersService.findByIdOrNull.mockResolvedValue(
        makeSanitizedUser({ isActive: false }),
      );

      await expect(service.refresh(REFRESH_TOKEN_VALUE)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(REFRESH_TOKEN_VALUE)).rejects.toThrow(
        'User not found or inactive',
      );
    });
  });

  describe('logout', () => {
    it('should revoke the token when it exists', async () => {
      authRepository.findByToken.mockResolvedValue(mockRefreshToken);
      authRepository.revokeById.mockResolvedValue(undefined);

      await service.logout(REFRESH_TOKEN_VALUE);

      expect(authRepository.findByToken).toHaveBeenCalledWith(
        REFRESH_TOKEN_VALUE,
      );
      expect(authRepository.revokeById).toHaveBeenCalledWith(
        mockRefreshToken.id,
      );
    });

    it('should throw UnauthorizedException when token does not exist', async () => {
      authRepository.findByToken.mockResolvedValue(null);

      await expect(service.logout('unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.logout('unknown-token')).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('calculateExpiration', () => {
    type AuthServicePrivate = {
      calculateExpiration: (expiresIn: string) => Date;
    };

    const calc = (expiresIn: string) =>
      (service as unknown as AuthServicePrivate).calculateExpiration(expiresIn);

    it('should calculate expiration in seconds', () => {
      const result = calc('60s');
      const expected = new Date(Date.now() + 60 * 1000);
      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should calculate expiration in minutes', () => {
      const result = calc('30m');
      const expected = new Date(Date.now() + 30 * 60 * 1000);
      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should calculate expiration in hours', () => {
      const result = calc('2h');
      const expected = new Date(Date.now() + 2 * 60 * 60 * 1000);
      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should calculate expiration in days', () => {
      const result = calc('7d');
      const expected = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });

    it('should default to 7 days for unrecognized format', () => {
      const result = calc('invalid');
      const expected = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(result.getTime()).toBeGreaterThanOrEqual(
        expected.getTime() - 1000,
      );
      expect(result.getTime()).toBeLessThanOrEqual(expected.getTime() + 1000);
    });
  });
});
