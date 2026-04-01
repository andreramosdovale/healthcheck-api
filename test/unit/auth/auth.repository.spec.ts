import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '@/auth/auth.repository';
import { DRIZZLE } from '@/database/drizzle.module';
import { makeRefreshToken, REFRESH_TOKEN_VALUE } from '@test/stubs/auth.stub';

type MockDb = {
  select: jest.Mock;
  update: jest.Mock;
  insert: jest.Mock;
};

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let mockDb: MockDb;

  const mockRefreshToken = makeRefreshToken();

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRepository, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findValidToken', () => {
    it('should return the token when a valid (non-revoked, non-expired) record is found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockRefreshToken]),
      });

      const result = await repository.findValidToken(REFRESH_TOKEN_VALUE);

      expect(result).toEqual(mockRefreshToken);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when no valid token is found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findValidToken(
        'expired-or-revoked-token',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should return the token regardless of revocation or expiration', async () => {
      const revokedToken = makeRefreshToken({
        revokedAt: new Date('2024-01-02'),
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([revokedToken]),
      });

      const result = await repository.findByToken(REFRESH_TOKEN_VALUE);

      expect(result).toEqual(revokedToken);
    });

    it('should return null when no token matches', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByToken('unknown-token');

      expect(result).toBeNull();
    });
  });

  describe('revokeById', () => {
    it('should update revokedAt for the given id', async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      await repository.revokeById(mockRefreshToken.id);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('revokeByToken', () => {
    it('should update revokedAt for the given token string', async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      await repository.revokeByToken(REFRESH_TOKEN_VALUE);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert a new refresh token record with the provided values', async () => {
      const mockValues = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values: mockValues });

      const expiresAt = new Date('2099-01-01');
      await repository.create(mockRefreshToken.userId, 'new-token', expiresAt);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId: mockRefreshToken.userId,
        token: 'new-token',
        expiresAt,
      });
    });
  });
});
