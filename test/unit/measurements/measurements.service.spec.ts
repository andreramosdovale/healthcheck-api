import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MeasurementsService } from '@/measurements/measurements.service';
import { DRIZZLE } from '@/database/drizzle.module';
import { CreateMeasurementDto } from '@/measurements/dto/create-measurement.dto';
import { UpdateMeasurementDto } from '@/measurements/dto/update-measurement.dto';

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const measurementId = '223e4567-e89b-12d3-a456-426614174001';

  const mockUser = {
    id: userId,
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

  const mockMeasurement = {
    id: measurementId,
    userId,
    measurementDate: '2024-01-15',
    weight: '80.00',
    triceps: null,
    subscapular: null,
    chest: null,
    midaxillary: null,
    suprailiac: null,
    abdominal: null,
    thigh: null,
    neck: null,
    shoulders: null,
    chestCirc: null,
    waist: null,
    hip: null,
    leftThigh: null,
    rightThigh: null,
    leftCalf: null,
    rightCalf: null,
    leftBicepRelaxed: null,
    rightBicepRelaxed: null,
    leftBicepFlexed: null,
    rightBicepFlexed: null,
    bodyFatPercentage: null,
    navyBodyFatPercentage: null,
    leanMass: null,
    fatMass: null,
    createdAt: new Date(),
    updatedAt: null,
  };

  const baseCreateDto: CreateMeasurementDto = {
    measurementDate: '2024-01-15',
    weight: 80,
  };

  const allSkinfolds = {
    triceps: 10,
    subscapular: 12,
    chest: 8,
    midaxillary: 9,
    suprailiac: 11,
    abdominal: 15,
    thigh: 13,
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
        MeasurementsService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<MeasurementsService>(MeasurementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a measurement with weight only', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      const result = await service.create(userId, baseCreateDto);

      expect(result).toEqual(mockMeasurement);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.create(userId, baseCreateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, baseCreateDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw BadRequestException when only some skinfolds are provided', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const dtoWithPartialSkinfolds: CreateMeasurementDto = {
        ...baseCreateDto,
        triceps: 10,
        subscapular: 12,
      };

      await expect(
        service.create(userId, dtoWithPartialSkinfolds),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(userId, dtoWithPartialSkinfolds),
      ).rejects.toThrow(
        'All 7 skinfolds are required when providing skinfold measurements',
      );
    });

    it('should create a measurement with all skinfolds and calculate Pollock body fat for male', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const measurementWithSkinfolds = {
        ...mockMeasurement,
        ...Object.fromEntries(
          Object.entries(allSkinfolds).map(([k, v]) => [k, v.toString()]),
        ),
        bodyFatPercentage: '14.25',
        leanMass: '68.60',
        fatMass: '11.40',
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([measurementWithSkinfolds]),
      });

      const dtoWithSkinfolds: CreateMeasurementDto = {
        ...baseCreateDto,
        ...allSkinfolds,
      };

      const result = await service.create(userId, dtoWithSkinfolds);

      expect(result).toEqual(measurementWithSkinfolds);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should create a measurement with all skinfolds and calculate Pollock body fat for female', async () => {
      const femaleUser = { ...mockUser, sex: 'female' as const };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([femaleUser]),
      });

      const measurementWithSkinfolds = {
        ...mockMeasurement,
        ...Object.fromEntries(
          Object.entries(allSkinfolds).map(([k, v]) => [k, v.toString()]),
        ),
        bodyFatPercentage: '22.10',
        leanMass: '62.32',
        fatMass: '17.68',
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([measurementWithSkinfolds]),
      });

      const dtoWithSkinfolds: CreateMeasurementDto = {
        ...baseCreateDto,
        ...allSkinfolds,
      };

      const result = await service.create(userId, dtoWithSkinfolds);

      expect(result).toEqual(measurementWithSkinfolds);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should calculate Navy body fat for male with neck and waist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      });

      const measurementWithNavy = {
        ...mockMeasurement,
        neck: '38.00',
        waist: '85.00',
        navyBodyFatPercentage: '18.50',
        leanMass: '65.20',
        fatMass: '14.80',
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([measurementWithNavy]),
      });

      const dtoWithNavy: CreateMeasurementDto = {
        ...baseCreateDto,
        neck: 38,
        waist: 85,
      };

      const result = await service.create(userId, dtoWithNavy);

      expect(result).toEqual(measurementWithNavy);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should calculate Navy body fat for female with neck, waist, and hip', async () => {
      const femaleUser = { ...mockUser, sex: 'female' as const };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([femaleUser]),
      });

      const measurementWithNavy = {
        ...mockMeasurement,
        neck: '33.00',
        waist: '72.00',
        hip: '96.00',
        navyBodyFatPercentage: '26.40',
        leanMass: '58.88',
        fatMass: '21.12',
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([measurementWithNavy]),
      });

      const dtoWithNavy: CreateMeasurementDto = {
        ...baseCreateDto,
        neck: 33,
        waist: 72,
        hip: 96,
      };

      const result = await service.create(userId, dtoWithNavy);

      expect(result).toEqual(measurementWithNavy);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should not calculate Navy body fat for female without hip', async () => {
      const femaleUser = { ...mockUser, sex: 'female' as const };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([femaleUser]),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      const dtoWithoutHip: CreateMeasurementDto = {
        ...baseCreateDto,
        neck: 33,
        waist: 72,
      };

      const result = await service.create(userId, dtoWithoutHip);

      expect(result).toEqual(mockMeasurement);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('findAllByUser', () => {
    it('should return all measurements for a user ordered by date', async () => {
      const measurements = [
        { ...mockMeasurement, measurementDate: '2024-01-15' },
        { ...mockMeasurement, id: 'another-id', measurementDate: '2024-01-10' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(measurements),
      });

      const result = await service.findAllByUser(userId);

      expect(result).toEqual(measurements);
      expect(result).toHaveLength(2);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when user has no measurements', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAllByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a measurement by id for the given user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      const result = await service.findOne(measurementId, userId);

      expect(result).toEqual(mockMeasurement);
      expect(result.id).toBe(measurementId);
      expect(result.userId).toBe(userId);
    });

    it('should throw NotFoundException when measurement not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findOne('non-existent-id', userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id', userId)).rejects.toThrow(
        'Measurement not found',
      );
    });

    it('should throw NotFoundException when measurement belongs to another user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.findOne(measurementId, 'different-user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateMeasurementDto = {
      weight: 82,
    };

    it('should update a measurement successfully', async () => {
      const updatedMeasurement = { ...mockMeasurement, weight: '82.00' };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedMeasurement]),
      });

      const result = await service.update(measurementId, userId, updateDto);

      expect(result).toEqual(updatedMeasurement);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when measurement not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.update('non-existent-id', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a measurement successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockMeasurement]),
      });

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.remove(measurementId, userId);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when measurement not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.remove('non-existent-id', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
