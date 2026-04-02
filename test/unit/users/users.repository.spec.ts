import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '@/users/users.repository';
import { DRIZZLE } from '@/database/drizzle.module';
import { makeUser, USER_ID } from '@test/stubs/user.stub';

type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockDb: MockDb;

  const mockUser = makeUser();

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersRepository, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findConflictingUser', () => {
    it('should return the user when email or nickname matches', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findConflictingUser(mockUser.email, mockUser.nickname);

      expect(result).toEqual(mockUser);
    });

    it('should return null when no conflict exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findConflictingUser(
        'new@example.com',
        'newuser',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users with default pagination when no search is provided', async () => {
      const users = [mockUser, makeUser({ id: 'another-id' })];
      const baseChain = {
        from: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(users),
        then: (resolve: (v: typeof users) => unknown) => Promise.resolve(users).then(resolve),
      };
      mockDb.select.mockReturnValue(baseChain);

      const result = await repository.findAll({ limit: 20, offset: 0 });

      expect(result).toEqual(users);
      expect(baseChain.limit).toHaveBeenCalledWith(20);
      expect(baseChain.offset).toHaveBeenCalledWith(0);
    });

    it('should apply where clause when search is provided', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockUser]);
      const baseChain = {
        from: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue({ where: mockWhere }),
      };
      mockDb.select.mockReturnValue(baseChain);

      const result = await repository.findAll({ search: 'test' });

      expect(result).toEqual([mockUser]);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return the user when found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findById(USER_ID);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return the user when email matches', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
    });

    it('should return null when email is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByNickname', () => {
    it('should return the user when nickname matches', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findByNickname(mockUser.nickname);

      expect(result).toEqual(mockUser);
    });

    it('should return null when nickname is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByNickname('unknown');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrNickname', () => {
    it('should return the user when login matches email or nickname', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findByEmailOrNickname(mockUser.email);

      expect(result).toEqual(mockUser);
    });

    it('should return null when no match is found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByEmailOrNickname('unknown');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should insert the user and return the created record', async () => {
      const mockReturning = jest.fn().mockResolvedValue([mockUser]);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const data = {
        email: mockUser.email,
        nickname: mockUser.nickname,
        passwordHash: mockUser.passwordHash,
        name: mockUser.name,
        birthDate: mockUser.birthDate,
        sex: mockUser.sex,
        height: mockUser.height,
        termsAccepted: true,
        termsAcceptedAt: new Date('2024-01-01'),
      };

      const result = await repository.create(data);

      expect(result).toEqual(mockUser);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(data);
      expect(mockReturning).toHaveBeenCalled();
    });
  });

  describe('assignDefaultRole', () => {
    it('should insert user-role relation when the user role exists', async () => {
      const mockRoleId = 'role-id-1';
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: mockRoleId }]),
      });
      const mockValues = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values: mockValues });

      await repository.assignDefaultRole(USER_ID);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({ userId: USER_ID, roleId: mockRoleId });
    });

    it('should not insert anything when the user role does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await repository.assignDefaultRole(USER_ID);

      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update the user and return the updated record', async () => {
      const updatedUser = makeUser({ name: 'Updated Name', height: '180' });
      const mockReturning = jest.fn().mockResolvedValue([updatedUser]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      const data = { name: 'Updated Name', height: '180', updatedAt: new Date('2024-01-01') };
      const result = await repository.update(USER_ID, data);

      expect(result).toEqual(updatedUser);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(data);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete the user by id', async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: mockWhere });

      await repository.delete(USER_ID);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
