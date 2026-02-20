import { Test, TestingModule } from '@nestjs/testing';
import { MeasurementsController } from '@/measurements/measurements.controller';
import { MeasurementsService } from '@/measurements/measurements.service';
import { CreateMeasurementDto } from '@/measurements/dto/create-measurement.dto';
import { UpdateMeasurementDto } from '@/measurements/dto/update-measurement.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

describe('MeasurementsController', () => {
  let controller: MeasurementsController;
  let service: MeasurementsService;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const measurementId = '223e4567-e89b-12d3-a456-426614174001';

  const mockRequest = {
    user: { id: userId },
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

  const createDto: CreateMeasurementDto = {
    measurementDate: '2024-01-15',
    weight: 80,
  };

  const updateDto: UpdateMeasurementDto = {
    weight: 82,
  };

  const mockMeasurementsService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeasurementsController],
      providers: [
        {
          provide: MeasurementsService,
          useValue: mockMeasurementsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<MeasurementsController>(MeasurementsController);
    service = module.get<MeasurementsService>(MeasurementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a measurement and return it', async () => {
      mockMeasurementsService.create.mockResolvedValue(mockMeasurement);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toEqual(mockMeasurement);
      expect(service.create).toHaveBeenCalledWith(userId, createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all measurements for the authenticated user', async () => {
      const measurements = [
        mockMeasurement,
        { ...mockMeasurement, id: 'another-id' },
      ];
      mockMeasurementsService.findAllByUser.mockResolvedValue(measurements);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(measurements);
      expect(service.findAllByUser).toHaveBeenCalledWith(userId);
      expect(service.findAllByUser).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no measurements', async () => {
      mockMeasurementsService.findAllByUser.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([]);
      expect(service.findAllByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return a single measurement by id', async () => {
      mockMeasurementsService.findOne.mockResolvedValue(mockMeasurement);

      const result = await controller.findOne(mockRequest, measurementId);

      expect(result).toEqual(mockMeasurement);
      expect(service.findOne).toHaveBeenCalledWith(measurementId, userId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a measurement and return the updated result', async () => {
      const updatedMeasurement = { ...mockMeasurement, weight: '82.00' };
      mockMeasurementsService.update.mockResolvedValue(updatedMeasurement);

      const result = await controller.update(
        mockRequest,
        measurementId,
        updateDto,
      );

      expect(result).toEqual(updatedMeasurement);
      expect(service.update).toHaveBeenCalledWith(
        measurementId,
        userId,
        updateDto,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a measurement and return undefined', async () => {
      mockMeasurementsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, measurementId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(measurementId, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
