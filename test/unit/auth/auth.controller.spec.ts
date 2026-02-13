import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { CreateUserDto } from '../../../src/users/dto/create-user.dto';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { RefreshTokenDto } from '../../../src/auth/dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    nickname: 'testuser',
    name: 'Test User',
    birthDate: '1990-01-01',
    sex: 'male',
    height: '175',
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

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

  const refreshTokenDto: RefreshTokenDto = {
    refreshToken: 'mock-refresh-token',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return user with tokens', async () => {
      const expectedResult = {
        user: mockUser,
        ...mockTokens,
      };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(service.register).toHaveBeenCalledWith(createUserDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should login and return user with tokens', async () => {
      const expectedResult = {
        user: mockUser,
        ...mockTokens,
      };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and return user with new tokens', async () => {
      const expectedResult = {
        user: mockUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(service.refresh).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(service.refresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const expectedResult = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(service.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(service.logout).toHaveBeenCalledTimes(1);
    });
  });
});
