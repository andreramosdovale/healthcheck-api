import { Test, TestingModule } from '@nestjs/testing';
import { MeasurementsController } from '@/measurements/measurements.controller';
import { MeasurementsService } from '@/measurements/measurements.service';
import { CreateMeasurementDto } from '@/measurements/dto/create-measurement.dto';
import { UpdateMeasurementDto } from '@/measurements/dto/update-measurement.dto';
import { ListMeasurementsDto } from '@/measurements/dto/list-measurements.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import {
  makeMeasurementResponse,
  makeListMeasurementsInput,
  USER_ID,
  MEASUREMENT_ID,
} from '@test/stubs/measurement.stub';

describe('MeasurementsController', () => {
  let controller: MeasurementsController;

  const mockRequest = { user: { id: USER_ID } };

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

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should map dto to CreateMeasurementInput, call service.create and return its result', async () => {
      const dto: CreateMeasurementDto = { measurementDate: '2024-01-15', weight: 80 };
      const expected = makeMeasurementResponse();
      mockMeasurementsService.create.mockResolvedValue(expected);

      const result = await controller.create(mockRequest, dto);

      expect(result).toEqual(expected);
      expect(mockMeasurementsService.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ measurementDate: '2024-01-15', weight: 80 }),
      );
    });
  });

  describe('findAll', () => {
    it('should map query to ListMeasurementsInput, call service.findAllByUser and return its result', async () => {
      const query: ListMeasurementsDto = { limit: 20, offset: 0 };
      const expected = [makeMeasurementResponse(), makeMeasurementResponse({ id: 'another-id' })];
      mockMeasurementsService.findAllByUser.mockResolvedValue(expected);

      const result = await controller.findAll(mockRequest, query);

      expect(result).toEqual(expected);
      expect(mockMeasurementsService.findAllByUser).toHaveBeenCalledWith(
        USER_ID,
        makeListMeasurementsInput(),
      );
    });

    it('should forward date filters to service.findAllByUser', async () => {
      const query: ListMeasurementsDto = {
        limit: 10,
        offset: 5,
        from: '2024-01-01',
        to: '2024-01-31',
      };
      mockMeasurementsService.findAllByUser.mockResolvedValue([]);

      await controller.findAll(mockRequest, query);

      expect(mockMeasurementsService.findAllByUser).toHaveBeenCalledWith(USER_ID, {
        limit: 10,
        offset: 5,
        from: '2024-01-01',
        to: '2024-01-31',
      });
    });

    it('should return empty array when user has no measurements', async () => {
      const query: ListMeasurementsDto = {};
      mockMeasurementsService.findAllByUser.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest, query);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and userId and return its result', async () => {
      const expected = makeMeasurementResponse();
      mockMeasurementsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockRequest, MEASUREMENT_ID);

      expect(result).toEqual(expected);
      expect(mockMeasurementsService.findOne).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        USER_ID,
      );
    });
  });

  describe('update', () => {
    it('should map dto to UpdateMeasurementInput, call service.update and return its result', async () => {
      const dto: UpdateMeasurementDto = { weight: 82 };
      const expected = makeMeasurementResponse({ weight: 82 });
      mockMeasurementsService.update.mockResolvedValue(expected);

      const result = await controller.update(mockRequest, MEASUREMENT_ID, dto);

      expect(result).toEqual(expected);
      expect(mockMeasurementsService.update).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        USER_ID,
        expect.objectContaining({ weight: 82 }),
      );
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and userId and return undefined', async () => {
      mockMeasurementsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, MEASUREMENT_ID);

      expect(result).toBeUndefined();
      expect(mockMeasurementsService.remove).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        USER_ID,
      );
    });
  });
});
