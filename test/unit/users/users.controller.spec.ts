import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '@/users/users.controller';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { makeSanitizedUser, makeCreateUserInput } from '@test/stubs/user.stub';

describe('UsersController', () => {
  let controller: UsersController;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call UsersService.create with mapped input and return its result', async () => {
      const user = makeSanitizedUser();
      mockUsersService.create.mockResolvedValue(user);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        makeCreateUserInput(),
      );
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should call UsersService.findAll and return all users', async () => {
      const users = [
        makeSanitizedUser(),
        makeSanitizedUser({ id: 'another-id' }),
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call UsersService.findById with the id and return its result', async () => {
      const user = makeSanitizedUser();
      mockUsersService.findById.mockResolvedValue(user);

      const result = await controller.findOne(user.id);

      expect(mockUsersService.findById).toHaveBeenCalledWith(user.id);
      expect(mockUsersService.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should call UsersService.update with id and mapped input and return its result', async () => {
      const updated = makeSanitizedUser({
        name: 'Updated Name',
        height: '180',
      });
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.update(updated.id, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(updated.id, {
        name: updateUserDto.name,
        height: updateUserDto.height,
      });
      expect(mockUsersService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call UsersService.remove with the id and return undefined', async () => {
      const user = makeSanitizedUser();
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(user.id);

      expect(mockUsersService.remove).toHaveBeenCalledWith(user.id);
      expect(mockUsersService.remove).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
