import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@/users/users.service';
import { DRIZZLE } from '@/database/drizzle.module';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: any;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    nickname: 'testuser',
    passwordHash: 'hashedPassword',
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

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUser]),
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw BadRequestException if terms not accepted', async () => {
      const dto = { ...createUserDto, termsAccepted: false };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Terms must be accepted',
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should throw ConflictException if nickname already exists', async () => {
      const existingUser = { ...mockUser, email: 'different@example.com' };
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([existingUser]),
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Nickname already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all users without password hash', async () => {
      mockDb.select.mockReturnValue({
        from: jest
          .fn()
          .mockResolvedValue([mockUser, { ...mockUser, id: 'another-id' }]),
      });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array if no users exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a user by id without password hash', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findById(mockUser.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findByEmail(mockUser.email);

      expect(result).toBe(mockUser);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByNickname', () => {
    it('should return a user by nickname', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findByNickname(mockUser.nickname);

      expect(result).toBe(mockUser);
      expect(result?.nickname).toBe(mockUser.nickname);
    });

    it('should return null if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findByNickname('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrNickname', () => {
    it('should return a user by email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findByEmailOrNickname(mockUser.email);

      expect(result).toBe(mockUser);
    });

    it('should return a user by nickname', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findByEmailOrNickname(mockUser.nickname);

      expect(result).toBe(mockUser);
    });

    it('should return null if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findByEmailOrNickname('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      height: 180,
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto, height: '180' };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedUser]),
      });

      const result = await service.update(mockUser.id, updateUserDto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.name).toBe(updateUserDto.name);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.update('non-existent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.remove(mockUser.id);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
