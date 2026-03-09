import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MeasurementsService } from '@/measurements/measurements.service';
import { MeasurementsRepository } from '@/measurements/measurements.repository';
import { CreateMeasurementDto } from '@/measurements/dto/create-measurement.dto';
import { UpdateMeasurementDto } from '@/measurements/dto/update-measurement.dto';
import {
  makeMeasurement,
  makeUserForMeasurement,
} from '@test/stubs/measurement.stub';

describe('MeasurementsService', () => {
  let service: MeasurementsService;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const measurementId = '223e4567-e89b-12d3-a456-426614174001';

  const mockRepository = {
    findUserById: jest.fn(),
    findAllByUser: jest.fn(),
    findById: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementsService,
        { provide: MeasurementsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MeasurementsService>(MeasurementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a measurement with weight only', async () => {
      const measurement = makeMeasurement();
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.insert.mockResolvedValue(measurement);

      const result = await service.create(userId, baseCreateDto);

      expect(result).toEqual(measurement);
      expect(mockRepository.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(service.create(userId, baseCreateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, baseCreateDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw BadRequestException when only some skinfolds are provided', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

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
      const measurement = makeMeasurement({
        ...Object.fromEntries(
          Object.entries(allSkinfolds).map(([k, v]) => [k, v.toString()]),
        ),
        bodyFatPercentage: '14.25',
        leanMass: '68.60',
        fatMass: '11.40',
      });

      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.insert.mockResolvedValue(measurement);

      const result = await service.create(userId, {
        ...baseCreateDto,
        ...allSkinfolds,
      });

      expect(result).toEqual(measurement);
      expect(mockRepository.insert).toHaveBeenCalled();
    });

    it('should create a measurement with all skinfolds and calculate Pollock body fat for female', async () => {
      const measurement = makeMeasurement({
        ...Object.fromEntries(
          Object.entries(allSkinfolds).map(([k, v]) => [k, v.toString()]),
        ),
        bodyFatPercentage: '22.10',
        leanMass: '62.32',
        fatMass: '17.68',
      });

      mockRepository.findUserById.mockResolvedValue(
        makeUserForMeasurement({ sex: 'female' }),
      );
      mockRepository.insert.mockResolvedValue(measurement);

      const result = await service.create(userId, {
        ...baseCreateDto,
        ...allSkinfolds,
      });

      expect(result).toEqual(measurement);
      expect(mockRepository.insert).toHaveBeenCalled();
    });

    it('should calculate Navy body fat for male with neck and waist', async () => {
      const measurement = makeMeasurement({
        neck: '38.00',
        waist: '85.00',
        navyBodyFatPercentage: '18.50',
        leanMass: '65.20',
        fatMass: '14.80',
      });

      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.insert.mockResolvedValue(measurement);

      const result = await service.create(userId, {
        ...baseCreateDto,
        neck: 38,
        waist: 85,
      });

      expect(result).toEqual(measurement);
      expect(mockRepository.insert).toHaveBeenCalled();
    });

    it('should calculate Navy body fat for female with neck, waist, and hip', async () => {
      const measurement = makeMeasurement({
        neck: '33.00',
        waist: '72.00',
        hip: '96.00',
        navyBodyFatPercentage: '26.40',
        leanMass: '58.88',
        fatMass: '21.12',
      });

      mockRepository.findUserById.mockResolvedValue(
        makeUserForMeasurement({ sex: 'female' }),
      );
      mockRepository.insert.mockResolvedValue(measurement);

      const result = await service.create(userId, {
        ...baseCreateDto,
        neck: 33,
        waist: 72,
        hip: 96,
      });

      expect(result).toEqual(measurement);
      expect(mockRepository.insert).toHaveBeenCalled();
    });

    it('should not calculate Navy body fat for female without hip', async () => {
      const measurement = makeMeasurement();

      mockRepository.findUserById.mockResolvedValue(
        makeUserForMeasurement({ sex: 'female' }),
      );
      mockRepository.insert.mockResolvedValue(measurement);

      const result = await service.create(userId, {
        ...baseCreateDto,
        neck: 33,
        waist: 72,
      });

      expect(result).toEqual(measurement);
      expect(mockRepository.insert).toHaveBeenCalled();
    });
  });

  describe('findAllByUser', () => {
    it('should return all measurements for a user ordered by date', async () => {
      const measurements = [
        makeMeasurement({ measurementDate: '2024-01-15' }),
        makeMeasurement({ id: 'another-id', measurementDate: '2024-01-10' }),
      ];
      mockRepository.findAllByUser.mockResolvedValue(measurements);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual(measurements);
      expect(result).toHaveLength(2);
      expect(mockRepository.findAllByUser).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when user has no measurements', async () => {
      mockRepository.findAllByUser.mockResolvedValue([]);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a measurement by id for the given user', async () => {
      const measurement = makeMeasurement();
      mockRepository.findById.mockResolvedValue(measurement);

      const result = await service.findOne(measurementId, userId);

      expect(result).toEqual(measurement);
      expect(result.id).toBe(measurementId);
      expect(result.userId).toBe(userId);
    });

    it('should throw NotFoundException when measurement not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id', userId)).rejects.toThrow(
        'Measurement not found',
      );
    });

    it('should throw NotFoundException when measurement belongs to another user', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.findOne(measurementId, 'different-user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateMeasurementDto = { weight: 82 };

    it('should update a measurement successfully', async () => {
      const updated = makeMeasurement({ weight: '82.00' });
      mockRepository.findById.mockResolvedValue(makeMeasurement());
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update(measurementId, userId, updateDto);

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when measurement not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a measurement successfully', async () => {
      mockRepository.findById.mockResolvedValue(makeMeasurement());
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(measurementId, userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(measurementId, userId);
    });

    it('should throw NotFoundException when measurement not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
