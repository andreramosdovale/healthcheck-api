import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '@/users/users.controller';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    nickname: 'testuser',
    name: 'Test User',
    birthDate: '1990-01-01',
    sex: 'male' as const,
    height: '175',
    plan: 'free' as const,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: null,
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

  const updateUserDto: UpdateUserDto = {
    name: 'Updated Name',
    height: 180,
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser, { ...mockUser, id: 'another-id' }];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(service.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto, height: '180' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser.id, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser.id);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockUser.id);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
