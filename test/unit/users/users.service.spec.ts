import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@/users/users.service';
import { UsersRepository } from '@/users/users.repository';
import {
  makeUser,
  makeCreateUserInput,
  makeUpdateUserInput,
  makeListUsersInput,
} from '@test/stubs/user.stub';

jest.mock('bcrypt');

type MockUsersRepository = {
  findConflictingUser: jest.Mock;
  findAll: jest.Mock;
  findById: jest.Mock;
  findByEmail: jest.Mock;
  findByNickname: jest.Mock;
  findByEmailOrNickname: jest.Mock;
  create: jest.Mock;
  assignDefaultRole: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: MockUsersRepository;

  const mockUser = makeUser();
  const createUserInput = makeCreateUserInput();
  const updateUserInput = makeUpdateUserInput();
  const listUsersInput = makeListUsersInput();

  beforeEach(async () => {
    mockRepository = {
      findConflictingUser: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      findByEmailOrNickname: jest.fn(),
      create: jest.fn(),
      assignDefaultRole: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should throw BadRequestException when termsAccepted is false', async () => {
      const input = makeCreateUserInput({ termsAccepted: false });

      await expect(service.create(input)).rejects.toThrow(BadRequestException);
      await expect(service.create(input)).rejects.toThrow('Terms must be accepted');
      expect(mockRepository.findConflictingUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(makeUser());

      await expect(service.create(createUserInput)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserInput)).rejects.toThrow('Email already exists');
    });

    it('should throw ConflictException when nickname already exists', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(
        makeUser({ email: 'other@example.com' }),
      );

      await expect(service.create(createUserInput)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserInput)).rejects.toThrow('Nickname already exists');
    });

    it('should hash the password with bcrypt cost factor 12', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockResolvedValue(mockUser);
      mockRepository.assignDefaultRole.mockResolvedValue(undefined);

      await service.create(createUserInput);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserInput.password, 12);
    });

    it('should assign default role after creating the user', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockResolvedValue(mockUser);
      mockRepository.assignDefaultRole.mockResolvedValue(undefined);

      await service.create(createUserInput);

      expect(mockRepository.assignDefaultRole).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return a sanitized user without passwordHash when successful', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockResolvedValue(mockUser);
      mockRepository.assignDefaultRole.mockResolvedValue(undefined);

      const result = await service.create(createUserInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(createUserInput.email);
    });
  });

  describe('findAll', () => {
    it('should return all users sanitized when no search is provided', async () => {
      mockRepository.findAll.mockResolvedValue([mockUser, makeUser({ id: 'another-id' })]);

      const result = await service.findAll(listUsersInput);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(mockRepository.findAll).toHaveBeenCalledWith(listUsersInput);
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll(listUsersInput);

      expect(result).toEqual([]);
    });

    it('should forward search input to the repository', async () => {
      const input = makeListUsersInput({ search: 'john' });
      mockRepository.findAll.mockResolvedValue([mockUser]);

      await service.findAll(input);

      expect(mockRepository.findAll).toHaveBeenCalledWith(input);
    });
  });

  describe('findById', () => {
    it('should return a sanitized user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findById('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('findByIdOrNull', () => {
    it('should return a sanitized user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findByIdOrNull(mockUser.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.id).toBe(mockUser.id);
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findByIdOrNull('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return the full user including passwordHash when found', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('passwordHash');
    });

    it('should return null when user is not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByNickname', () => {
    it('should return the full user including passwordHash when found', async () => {
      mockRepository.findByNickname.mockResolvedValue(mockUser);

      const result = await service.findByNickname(mockUser.nickname);

      expect(result).toHaveProperty('passwordHash');
      expect(result?.nickname).toBe(mockUser.nickname);
    });

    it('should return null when user is not found', async () => {
      mockRepository.findByNickname.mockResolvedValue(null);

      expect(await service.findByNickname('nonexistent')).toBeNull();
    });
  });

  describe('findByEmailOrNickname', () => {
    it('should return the full user when found by email', async () => {
      mockRepository.findByEmailOrNickname.mockResolvedValue(mockUser);

      const result = await service.findByEmailOrNickname(mockUser.email);

      expect(result).toEqual(mockUser);
    });

    it('should return the full user when found by nickname', async () => {
      mockRepository.findByEmailOrNickname.mockResolvedValue(mockUser);

      const result = await service.findByEmailOrNickname(mockUser.nickname);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockRepository.findByEmailOrNickname.mockResolvedValue(null);

      expect(await service.findByEmailOrNickname('nonexistent')).toBeNull();
    });
  });

  describe('update', () => {
    it('should return a sanitized updated user when successful', async () => {
      const updatedUser = makeUser({ name: 'Updated Name', height: '180' });
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateUserInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.name).toBe(updateUserInput.name);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateUserInput)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should convert height to string before passing to repository', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(mockUser);

      await service.update(mockUser.id, updateUserInput);

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ height: String(updateUserInput.height) }),
      );
    });
  });

  describe('remove', () => {
    it('should delete the user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(mockUser.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
