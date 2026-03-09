import { SetMetadata } from '@nestjs/common';
import {
  PERMISSIONS_KEY,
  Permissions,
} from '@/common/decorators/permissions.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key: string, value: string[]) => {
    return (target: object) => {
      Reflect.defineMetadata(key, value, target);
      return target;
    };
  }),
}));

describe('Permissions Decorator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should define PERMISSIONS_KEY constant', () => {
    expect(PERMISSIONS_KEY).toBe('permissions');
  });

  it('should call SetMetadata with correct parameters for single permission', () => {
    const permission = 'read:users';

    Permissions(permission);

    expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [permission]);
  });

  it('should call SetMetadata with correct parameters for multiple permissions', () => {
    const permissions = ['read:users', 'write:users', 'delete:users'];

    Permissions(...permissions);

    expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, permissions);
  });

  it('should call SetMetadata with empty array when no permissions provided', () => {
    Permissions();

    expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, []);
  });

  it('should return a decorator function', () => {
    const decorator = Permissions('read:users');

    expect(typeof decorator).toBe('function');
  });

  it('should handle permission names with special characters', () => {
    const permissions = ['admin:*', 'user:create', 'resource:read:all'];

    Permissions(...permissions);

    expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, permissions);
  });
});
