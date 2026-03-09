import { Test, TestingModule } from '@nestjs/testing';
import { MeasurementsController } from '@/measurements/measurements.controller';
import { MeasurementsService } from '@/measurements/measurements.service';
import { CreateMeasurementDto } from '@/measurements/dto/create-measurement.dto';
import { UpdateMeasurementDto } from '@/measurements/dto/update-measurement.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { makeMeasurement } from '@test/stubs/measurement.stub';

describe('MeasurementsController', () => {
  let controller: MeasurementsController;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const measurementId = '223e4567-e89b-12d3-a456-426614174001';

  const mockRequest = { user: { id: userId } };

  const createDto: CreateMeasurementDto = {
    measurementDate: '2024-01-15',
    weight: 80,
  };

  const updateDto: UpdateMeasurementDto = { weight: 82 };

  const mockMeasurementsService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeasurementsController],
      providers: [
        { provide: MeasurementsService, useValue: mockMeasurementsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MeasurementsController>(MeasurementsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a measurement and return it', async () => {
      const measurement = makeMeasurement();
      mockMeasurementsService.create.mockResolvedValue(measurement);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toEqual(measurement);
      expect(mockMeasurementsService.create).toHaveBeenCalledWith(
        userId,
        createDto,
      );
      expect(mockMeasurementsService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all measurements for the authenticated user', async () => {
      const measurements = [
        makeMeasurement(),
        makeMeasurement({ id: 'another-id' }),
      ];
      mockMeasurementsService.findAllByUser.mockResolvedValue(measurements);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(measurements);
      expect(mockMeasurementsService.findAllByUser).toHaveBeenCalledWith(
        userId,
      );
      expect(mockMeasurementsService.findAllByUser).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no measurements', async () => {
      mockMeasurementsService.findAllByUser.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([]);
      expect(mockMeasurementsService.findAllByUser).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single measurement by id', async () => {
      const measurement = makeMeasurement();
      mockMeasurementsService.findOne.mockResolvedValue(measurement);

      const result = await controller.findOne(mockRequest, measurementId);

      expect(result).toEqual(measurement);
      expect(mockMeasurementsService.findOne).toHaveBeenCalledWith(
        measurementId,
        userId,
      );
      expect(mockMeasurementsService.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a measurement and return the updated result', async () => {
      const updated = makeMeasurement({ weight: '82.00' });
      mockMeasurementsService.update.mockResolvedValue(updated);

      const result = await controller.update(
        mockRequest,
        measurementId,
        updateDto,
      );

      expect(result).toEqual(updated);
      expect(mockMeasurementsService.update).toHaveBeenCalledWith(
        measurementId,
        userId,
        updateDto,
      );
      expect(mockMeasurementsService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a measurement and return undefined', async () => {
      mockMeasurementsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, measurementId);

      expect(result).toBeUndefined();
      expect(mockMeasurementsService.remove).toHaveBeenCalledWith(
        measurementId,
        userId,
      );
      expect(mockMeasurementsService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
