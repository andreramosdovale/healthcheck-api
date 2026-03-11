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
} from '@test/stubs/user.stub';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findConflictingUser: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByNickname: jest.fn(),
    findByEmailOrNickname: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const createUserInput = makeCreateUserInput();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException when termsAccepted is false', async () => {
      const input = makeCreateUserInput({ termsAccepted: false });

      await expect(service.create(input)).rejects.toThrow(BadRequestException);
      await expect(service.create(input)).rejects.toThrow(
        'Terms must be accepted',
      );
      expect(mockRepository.findConflictingUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(makeUser());

      await expect(service.create(createUserInput)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserInput)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should throw ConflictException when nickname already exists', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(
        makeUser({ email: 'other@example.com' }),
      );

      await expect(service.create(createUserInput)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserInput)).rejects.toThrow(
        'Nickname already exists',
      );
    });

    it('should hash the password with bcrypt cost factor 12', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockResolvedValue(makeUser());

      await service.create(createUserInput);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserInput.password, 12);
    });

    it('should return a sanitized user without passwordHash when successful', async () => {
      mockRepository.findConflictingUser.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockResolvedValue(makeUser());

      const result = await service.create(createUserInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(createUserInput.email);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwordHash', async () => {
      mockRepository.findAll.mockResolvedValue([
        makeUser(),
        makeUser({ id: 'another-id' }),
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('hashedPassword');
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a sanitized user when found', async () => {
      mockRepository.findById.mockResolvedValue(makeUser());

      const result = await service.findById(makeUser().id);

      expect(result).not.toHaveProperty('hashedPassword');
      expect(result.id).toBe(makeUser().id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return the full user including passwordHash when found', async () => {
      const user = makeUser();
      mockRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(result).toEqual(user);
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
      const user = makeUser();
      mockRepository.findByNickname.mockResolvedValue(user);

      const result = await service.findByNickname(user.nickname);

      expect(result).toHaveProperty('passwordHash');
      expect(result?.nickname).toBe(user.nickname);
    });

    it('should return null when user is not found', async () => {
      mockRepository.findByNickname.mockResolvedValue(null);

      expect(await service.findByNickname('nonexistent')).toBeNull();
    });
  });

  describe('findByEmailOrNickname', () => {
    it('should return the full user including passwordHash when found by email', async () => {
      const user = makeUser();
      mockRepository.findByEmailOrNickname.mockResolvedValue(user);

      const result = await service.findByEmailOrNickname(user.email);

      expect(result).toEqual(user);
    });

    it('should return the full user when found by nickname', async () => {
      const user = makeUser();
      mockRepository.findByEmailOrNickname.mockResolvedValue(user);

      const result = await service.findByEmailOrNickname(user.nickname);

      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      mockRepository.findByEmailOrNickname.mockResolvedValue(null);

      expect(await service.findByEmailOrNickname('nonexistent')).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserInput = makeUpdateUserInput();

    it('should return a sanitized updated user when successful', async () => {
      const updatedUser = makeUser({ name: 'Updated Name', height: '180' });
      mockRepository.findById.mockResolvedValue(makeUser());
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(makeUser().id, updateUserInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.name).toBe(updateUserInput.name);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateUserInput),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should convert height to string before passing to repository', async () => {
      mockRepository.findById.mockResolvedValue(makeUser());
      mockRepository.update.mockResolvedValue(makeUser());

      await service.update(makeUser().id, updateUserInput);

      expect(mockRepository.update).toHaveBeenCalledWith(
        makeUser().id,
        expect.objectContaining({ height: '180' }),
      );
    });
  });

  describe('remove', () => {
    it('should delete the user when found', async () => {
      const user = makeUser();
      mockRepository.findById.mockResolvedValue(user);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(user.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(user.id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
