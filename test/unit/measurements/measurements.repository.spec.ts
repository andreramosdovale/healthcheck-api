import { Test, TestingModule } from '@nestjs/testing';
import { MeasurementsRepository } from '@/measurements/measurements.repository';
import { DRIZZLE } from '@/database/drizzle.module';
import {
  makeMeasurement,
  makeUserForMeasurement,
  makeListMeasurementsInput,
  USER_ID,
  MEASUREMENT_ID,
} from '@test/stubs/measurement.stub';

type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('MeasurementsRepository', () => {
  let repository: MeasurementsRepository;
  let mockDb: MockDb;

  const mockMeasurement = makeMeasurement();
  const mockUser = makeUserForMeasurement();

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementsRepository,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    repository = module.get<MeasurementsRepository>(MeasurementsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findUserById', () => {
    it('should return birthDate, sex and height when user exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findUserById(USER_ID);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('should return all measurements for the user without date filters', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockMeasurement]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findAllByUser(
        USER_ID,
        makeListMeasurementsInput(),
      );

      expect(result).toEqual([mockMeasurement]);
      expect(chain.limit).toHaveBeenCalledWith(20);
      expect(chain.offset).toHaveBeenCalledWith(0);
    });

    it('should apply from and to date filters when provided', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockMeasurement]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findAllByUser(
        USER_ID,
        makeListMeasurementsInput({ from: '2024-01-01', to: '2024-01-31' }),
      );

      expect(result).toEqual([mockMeasurement]);
      expect(chain.where).toHaveBeenCalled();
    });

    it('should return empty array when user has no measurements', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findAllByUser(
        USER_ID,
        makeListMeasurementsInput(),
      );

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return the measurement when found for the given user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      const result = await repository.findById(MEASUREMENT_ID, USER_ID);

      expect(result).toEqual(mockMeasurement);
    });

    it('should return null when not found or belongs to another user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findById(MEASUREMENT_ID, 'other-user-id');

      expect(result).toBeNull();
    });
  });

  describe('insert', () => {
    it('should insert and return the created measurement', async () => {
      const mockReturning = jest.fn().mockResolvedValue([mockMeasurement]);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const data = {
        userId: USER_ID,
        measurementDate: '2024-01-15',
        weight: '80.00',
      };

      const result = await repository.insert(
        data as Parameters<typeof repository.insert>[0],
      );

      expect(result).toEqual(mockMeasurement);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(data);
    });
  });

  describe('update', () => {
    it('should update and return the updated measurement', async () => {
      const updatedMeasurement = makeMeasurement({ weight: '82.00' });
      const mockReturning = jest.fn().mockResolvedValue([updatedMeasurement]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      const data = { weight: '82.00', updatedAt: new Date('2024-01-02') };
      const result = await repository.update(MEASUREMENT_ID, USER_ID, data);

      expect(result).toEqual(updatedMeasurement);
      expect(mockSet).toHaveBeenCalledWith(data);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete the measurement matching id and userId', async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: mockWhere });

      await repository.delete(MEASUREMENT_ID, USER_ID);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
