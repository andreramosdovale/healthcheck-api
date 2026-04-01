import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { makeSanitizedUser } from '@test/stubs/user.stub';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should map dto to CreateUserInput, call service.register and return its result', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        nickname: 'testuser',
        password: 'Test@1234',
        name: 'Test User',
        birthDate: '1990-01-01',
        sex: 'male',
        height: 175,
        termsAccepted: true,
      };
      const expected = { user: makeSanitizedUser(), accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: dto.email,
        nickname: dto.nickname,
        password: dto.password,
        name: dto.name,
        birthDate: dto.birthDate,
        sex: dto.sex,
        height: dto.height,
        termsAccepted: dto.termsAccepted,
      });
    });
  });

  describe('login', () => {
    it('should map dto to LoginInput, call service.login and return its result', async () => {
      const dto: LoginDto = {
        login: 'test@example.com',
        password: 'Test@1234',
      };
      const expected = { user: makeSanitizedUser(), accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith({
        login: dto.login,
        password: dto.password,
      });
    });
  });

  describe('refresh', () => {
    it('should call service.refresh with the token string and return its result', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'mock-refresh-token' };
      const expected = { accessToken: 'new-at', refreshToken: 'new-rt' };
      mockAuthService.refresh.mockResolvedValue(expected);

      const result = await controller.refresh(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto.refreshToken);
    });
  });

  describe('logout', () => {
    it('should call service.logout with the token string and return its result', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'mock-refresh-token' };
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(dto);

      expect(result).toBeUndefined();
      expect(mockAuthService.logout).toHaveBeenCalledWith(dto.refreshToken);
    });
  });
});
