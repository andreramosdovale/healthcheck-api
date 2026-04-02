import { Test, TestingModule } from '@nestjs/testing';
import { EvolutionRepository } from '@/evolution/evolution.repository';
import { DRIZZLE } from '@/database/drizzle.module';
import { makeMeasurement, USER_ID, MEASUREMENT_ID } from '@test/stubs/measurement.stub';

type MockDb = {
  select: jest.Mock;
};

describe('EvolutionRepository', () => {
  let repository: EvolutionRepository;
  let mockDb: MockDb;

  const mockMeasurement = makeMeasurement();

  beforeEach(async () => {
    mockDb = { select: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvolutionRepository,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    repository = module.get<EvolutionRepository>(EvolutionRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSummary', () => {
    const rawRow = {
      date: '2024-01-15',
      weight: '80.00',
      bodyFatPercentage: null,
      navyBodyFatPercentage: null,
      leanMass: null,
      fatMass: null,
    };

    const makeChain = (resolvedValue: unknown[]) => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(resolvedValue),
    });

    it('should return mapped summary points without date filters', async () => {
      mockDb.select.mockReturnValue(makeChain([rawRow]));

      const result = await repository.getSummary(USER_ID, { limit: 30 });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        weight: 80,
        bodyFatPercentage: null,
        bodyFatMethod: null,
        leanMass: null,
        fatMass: null,
      });
    });

    it('should apply from filter when provided', async () => {
      const chain = makeChain([rawRow]);
      mockDb.select.mockReturnValue(chain);

      await repository.getSummary(USER_ID, { limit: 30, from: '2024-01-01' });

      expect(chain.where).toHaveBeenCalled();
    });

    it('should apply to filter when provided', async () => {
      const chain = makeChain([rawRow]);
      mockDb.select.mockReturnValue(chain);

      await repository.getSummary(USER_ID, { limit: 30, to: '2024-12-31' });

      expect(chain.where).toHaveBeenCalled();
    });

    it('should pass limit to the query', async () => {
      const chain = makeChain([]);
      mockDb.select.mockReturnValue(chain);

      await repository.getSummary(USER_ID, { limit: 10 });

      expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it('should resolve body fat from bodyFatPercentage with pollock method', async () => {
      mockDb.select.mockReturnValue(
        makeChain([{ ...rawRow, bodyFatPercentage: '20.00' }]),
      );

      const result = await repository.getSummary(USER_ID, { limit: 30 });

      expect(result[0].bodyFatPercentage).toBe(20);
      expect(result[0].bodyFatMethod).toBe('pollock');
    });

    it('should fall back to navyBodyFatPercentage with navy method when bodyFatPercentage is null', async () => {
      mockDb.select.mockReturnValue(
        makeChain([{ ...rawRow, navyBodyFatPercentage: '18.00' }]),
      );

      const result = await repository.getSummary(USER_ID, { limit: 30 });

      expect(result[0].bodyFatPercentage).toBe(18);
      expect(result[0].bodyFatMethod).toBe('navy');
    });

    it('should return empty array when no measurements exist', async () => {
      mockDb.select.mockReturnValue(makeChain([]));

      const result = await repository.getSummary(USER_ID, { limit: 30 });

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return the measurement when found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      const result = await repository.findById(MEASUREMENT_ID);

      expect(result).toEqual(mockMeasurement);
    });

    it('should return null when measurement is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findLatestTwo', () => {
    it('should return two most recent measurements ordered by date descending', async () => {
      const m1 = makeMeasurement({ measurementDate: '2024-02-01' });
      const m2 = makeMeasurement({ id: 'another-id', measurementDate: '2024-01-15' });

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([m1, m2]),
      });

      const result = await repository.findLatestTwo(USER_ID);

      expect(result).toEqual([m1, m2]);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no measurements', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findLatestTwo(USER_ID);

      expect(result).toEqual([]);
    });
  });

  describe('findPreviousMeasurement', () => {
    it('should return the most recent measurement before the given date', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      const result = await repository.findPreviousMeasurement(USER_ID, '2024-02-01');

      expect(result).toEqual(mockMeasurement);
    });

    it('should return null when no previous measurement exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findPreviousMeasurement(USER_ID, '2024-01-01');

      expect(result).toBeNull();
    });
  });
});
