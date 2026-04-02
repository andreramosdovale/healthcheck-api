import { Test, TestingModule } from '@nestjs/testing';
import { EvolutionController } from '@/evolution/evolution.controller';
import { EvolutionService } from '@/evolution/evolution.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import {
  makeMeasurement,
  USER_ID,
  MEASUREMENT_ID,
} from '@test/stubs/measurement.stub';

describe('EvolutionController', () => {
  let controller: EvolutionController;

  const fromId = '223e4567-e89b-12d3-a456-426614174001';
  const toId = '323e4567-e89b-12d3-a456-426614174002';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mockRequest = { user: { id: USER_ID } };

  const mockEvolutionService = {
    getSummary: jest.fn(),
    compare: jest.fn(),
    getLatest: jest.fn(),
    getDelta: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvolutionController],
      providers: [
        { provide: EvolutionService, useValue: mockEvolutionService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EvolutionController>(EvolutionController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSummary', () => {
    const summaryPoints = [
      {
        date: '2024-01-01',
        weight: 80,
        bodyFatPercentage: null,
        bodyFatMethod: null,
        leanMass: null,
        fatMass: null,
      },
      {
        date: '2024-02-01',
        weight: 78.5,
        bodyFatPercentage: 15.2,
        bodyFatMethod: 'pollock' as const,
        leanMass: 66.53,
        fatMass: 11.97,
      },
    ];

    it('should call service.getSummary with userId and default limit and return its result', async () => {
      mockEvolutionService.getSummary.mockResolvedValue(summaryPoints);

      const result = await controller.getSummary(mockRequest, 30);

      expect(result).toEqual(summaryPoints);
      expect(mockEvolutionService.getSummary).toHaveBeenCalledWith(USER_ID, {
        limit: 30,
        from: undefined,
        to: undefined,
      });
    });

    it('should forward custom limit to service.getSummary', async () => {
      mockEvolutionService.getSummary.mockResolvedValue(summaryPoints);

      await controller.getSummary(mockRequest, 10);

      expect(mockEvolutionService.getSummary).toHaveBeenCalledWith(USER_ID, {
        limit: 10,
        from: undefined,
        to: undefined,
      });
    });

    it('should forward date filters to service.getSummary', async () => {
      mockEvolutionService.getSummary.mockResolvedValue([]);

      await controller.getSummary(mockRequest, 30, '2024-01-01', '2024-12-31');

      expect(mockEvolutionService.getSummary).toHaveBeenCalledWith(USER_ID, {
        limit: 30,
        from: '2024-01-01',
        to: '2024-12-31',
      });
    });

    it('should return empty array when no measurements exist', async () => {
      mockEvolutionService.getSummary.mockResolvedValue([]);

      const result = await controller.getSummary(mockRequest, 30);

      expect(result).toEqual([]);
    });
  });

  describe('compare', () => {
    const compareResult = {
      from: makeMeasurement({ id: fromId, measurementDate: '2024-01-01' }),
      to: makeMeasurement({
        id: toId,
        measurementDate: '2024-02-01',
        weight: '78.00',
      }),
      diff: {
        days: 31,
        weight: -2,
        bodyFatPercentage: null,
        leanMass: null,
        fatMass: null,
      },
    };

    it('should call service.compare with userId, fromId and toId and return its result', async () => {
      mockEvolutionService.compare.mockResolvedValue(compareResult);

      const result = await controller.compare(mockRequest, fromId, toId);

      expect(result).toEqual(compareResult);
      expect(mockEvolutionService.compare).toHaveBeenCalledWith(
        USER_ID,
        fromId,
        toId,
      );
    });
  });

  describe('getLatest', () => {
    it('should call service.getLatest with userId and return its result', async () => {
      const latestResult = {
        current: makeMeasurement({
          id: toId,
          measurementDate: '2024-02-01',
          weight: '78.00',
        }),
        previous: makeMeasurement({
          id: fromId,
          measurementDate: '2024-01-01',
        }),
        trend: 'improving' as const,
        trendCode: 'weight_loss' as const,
      };
      mockEvolutionService.getLatest.mockResolvedValue(latestResult);

      const result = await controller.getLatest(mockRequest);

      expect(result).toEqual(latestResult);
      expect(mockEvolutionService.getLatest).toHaveBeenCalledWith(USER_ID);
    });

    it('should return null trend and first_measurement trendCode when only one measurement exists', async () => {
      const firstMeasurement = {
        current: makeMeasurement(),
        previous: null,
        trend: null,
        trendCode: 'first_measurement' as const,
      };
      mockEvolutionService.getLatest.mockResolvedValue(firstMeasurement);

      const result = await controller.getLatest(mockRequest);

      expect(result).toEqual(firstMeasurement);
    });
  });

  describe('getDelta', () => {
    it('should call service.getDelta with userId and measurementId and return its result', async () => {
      const deltaResult = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        measurementId: MEASUREMENT_ID,
        previousMeasurementId: fromId,
        delta: null,
      };
      mockEvolutionService.getDelta.mockResolvedValue(deltaResult);

      const result = await controller.getDelta(mockRequest, MEASUREMENT_ID);

      expect(result).toEqual(deltaResult);
      expect(mockEvolutionService.getDelta).toHaveBeenCalledWith(
        USER_ID,
        MEASUREMENT_ID,
      );
    });

    it('should return null delta when there is no previous measurement', async () => {
      const deltaResult = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        measurementId: MEASUREMENT_ID,
        previousMeasurementId: null,
        delta: null,
      };
      mockEvolutionService.getDelta.mockResolvedValue(deltaResult);

      const result = await controller.getDelta(mockRequest, MEASUREMENT_ID);

      expect(result).toEqual(deltaResult);
    });
  });
});
