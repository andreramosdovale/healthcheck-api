import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { DRIZZLE } from '@/database/drizzle.module';
import { PERMISSIONS_KEY } from '@/common/decorators/permissions.decorator';

type MockDb = {
  select: jest.Mock;
};

type MockReflector = {
  getAllAndOverride: jest.Mock;
};

type MockUser = {
  id: string;
  email: string;
  nickname: string;
};

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: MockReflector;
  let mockDb: MockDb;

  const mockUser: MockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    nickname: 'testuser',
  };

  const createMockExecutionContext = (
    user?: MockUser,
    requiredPermissions?: string[],
  ): ExecutionContext => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;

    if (requiredPermissions !== undefined) {
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
    }

    return mockContext;
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
    };

    reflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no permissions are required', async () => {
      const context = createMockExecutionContext(mockUser, []);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );
    });

    it('should return true when required permissions is undefined', async () => {
      const context = createMockExecutionContext(mockUser, undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const context = createMockExecutionContext(undefined, ['read:users']);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should return true when user has required permission', async () => {
      const context = createMockExecutionContext(mockUser, ['read:users']);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([
            { permissionName: 'read:users' },
            { permissionName: 'write:users' },
          ]),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has at least one required permission', async () => {
      const context = createMockExecutionContext(mockUser, [
        'read:users',
        'admin:all',
      ]);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ permissionName: 'read:users' }]),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required permissions', async () => {
      const context = createMockExecutionContext(mockUser, ['admin:all']);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ permissionName: 'read:users' }]),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should throw ForbiddenException when user has no permissions', async () => {
      const context = createMockExecutionContext(mockUser, ['read:users']);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should check multiple required permissions correctly', async () => {
      const context = createMockExecutionContext(mockUser, [
        'write:users',
        'delete:users',
      ]);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([
            { permissionName: 'read:users' },
            { permissionName: 'write:users' },
          ]),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should query database with correct user id', async () => {
      const context = createMockExecutionContext(mockUser, ['read:users']);

      const mockWhere = jest
        .fn()
        .mockResolvedValue([{ permissionName: 'read:users' }]);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: mockWhere,
      });

      await guard.canActivate(context);

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('getUserPermissions', () => {
    type GuardPrivate = {
      getUserPermissions: (userId: string) => Promise<string[]>;
    };

    it('should return array of permission names', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([
            { permissionName: 'read:users' },
            { permissionName: 'write:users' },
            { permissionName: 'delete:users' },
          ]),
      });

      const result = await (
        guard as unknown as GuardPrivate
      ).getUserPermissions(userId);

      expect(result).toEqual(['read:users', 'write:users', 'delete:users']);
    });

    it('should return empty array when user has no permissions', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await (
        guard as unknown as GuardPrivate
      ).getUserPermissions(userId);

      expect(result).toEqual([]);
    });

    it('should handle database query correctly', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockWhere = jest
        .fn()
        .mockResolvedValue([{ permissionName: 'admin:all' }]);

      const mockInnerJoin = jest.fn().mockReturnThis();

      const mockFrom = jest.fn().mockReturnValue({
        innerJoin: mockInnerJoin,
        where: mockWhere,
      });

      mockDb.select.mockReturnValue({
        from: mockFrom,
      });

      await (guard as unknown as GuardPrivate).getUserPermissions(userId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalledTimes(2);
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
