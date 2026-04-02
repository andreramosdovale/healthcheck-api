import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '@/users/users.controller';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { ListUsersDto } from '@/users/dto/list-users.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import {
  makeSanitizedUser,
  makeCreateUserInput,
  makeListUsersInput,
} from '@test/stubs/user.stub';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should map dto to CreateUserInput, call service.create and return its result', async () => {
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
      const expected = makeSanitizedUser();
      mockUsersService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(mockUsersService.create).toHaveBeenCalledWith(makeCreateUserInput());
    });
  });

  describe('findAll', () => {
    it('should map query to ListUsersInput, call service.findAll and return its result', async () => {
      const query: ListUsersDto = { limit: 20, offset: 0 };
      const expected = [makeSanitizedUser(), makeSanitizedUser({ id: 'another-id' })];
      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(result).toEqual(expected);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(makeListUsersInput());
    });

    it('should forward search param to service.findAll', async () => {
      const query: ListUsersDto = { limit: 10, offset: 5, search: 'john' };
      mockUsersService.findAll.mockResolvedValue([]);

      await controller.findAll(query);

      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 5,
        search: 'john',
      });
    });
  });

  describe('getMe', () => {
    it('should return the authenticated user directly without calling the service', () => {
      const user = makeSanitizedUser();

      const result = controller.getMe(user);

      expect(result).toEqual(user);
      expect(mockUsersService.findAll).not.toHaveBeenCalled();
      expect(mockUsersService.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('should call service.update with the current user id and mapped input', async () => {
      const user = makeSanitizedUser();
      const dto: UpdateUserDto = { name: 'Updated Name', height: 180 };
      const expected = makeSanitizedUser({ name: 'Updated Name', height: '180' });
      mockUsersService.update.mockResolvedValue(expected);

      const result = await controller.updateMe(user, dto);

      expect(result).toEqual(expected);
      expect(mockUsersService.update).toHaveBeenCalledWith(user.id, {
        name: dto.name,
        height: dto.height,
      });
    });
  });

  describe('findOne', () => {
    it('should call service.findById with the id and return its result', async () => {
      const user = makeSanitizedUser();
      mockUsersService.findById.mockResolvedValue(user);

      const result = await controller.findOne(user.id);

      expect(result).toEqual(user);
      expect(mockUsersService.findById).toHaveBeenCalledWith(user.id);
    });
  });

  describe('update', () => {
    it('should call service.update with id and mapped input and return its result', async () => {
      const user = makeSanitizedUser();
      const dto: UpdateUserDto = { name: 'Updated Name', height: 180 };
      const expected = makeSanitizedUser({ name: 'Updated Name', height: '180' });
      mockUsersService.update.mockResolvedValue(expected);

      const result = await controller.update(user.id, dto);

      expect(result).toEqual(expected);
      expect(mockUsersService.update).toHaveBeenCalledWith(user.id, {
        name: dto.name,
        height: dto.height,
      });
    });
  });

  describe('remove', () => {
    it('should call service.remove with the id and return undefined', async () => {
      const user = makeSanitizedUser();
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(user.id);

      expect(result).toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith(user.id);
    });
  });
});
