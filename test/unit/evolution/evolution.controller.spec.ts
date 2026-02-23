import { Test, TestingModule } from '@nestjs/testing';
import { EvolutionController } from '@/evolution/evolution.controller';
import { EvolutionService } from '@/evolution/evolution.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

describe('EvolutionController', () => {
  let controller: EvolutionController;
  let service: EvolutionService;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const fromId = '223e4567-e89b-12d3-a456-426614174001';
  const toId = '323e4567-e89b-12d3-a456-426614174002';

  const mockRequest = {
    user: { id: userId },
  };

  const baseMeasurement = {
    id: fromId,
    userId,
    measurementDate: '2024-01-01',
    weight: '80.00',
    bodyFatPercentage: null,
    navyBodyFatPercentage: null,
    leanMass: null,
    fatMass: null,
    createdAt: new Date(),
    updatedAt: null,
  };

  const mockEvolutionService = {
    getSummary: jest.fn(),
    compare: jest.fn(),
    getLatest: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvolutionController],
      providers: [
        {
          provide: EvolutionService,
          useValue: mockEvolutionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<EvolutionController>(EvolutionController);
    service = module.get<EvolutionService>(EvolutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    const summaryPoints = [
      {
        date: '2024-01-01',
        weight: 80,
        bodyFatPercentage: null,
        navyBodyFatPercentage: null,
        leanMass: null,
        fatMass: null,
      },
      {
        date: '2024-02-01',
        weight: 78.5,
        bodyFatPercentage: 15.2,
        navyBodyFatPercentage: null,
        leanMass: 66.53,
        fatMass: 11.97,
      },
    ];

    it('should return summary points for the authenticated user', async () => {
      mockEvolutionService.getSummary.mockResolvedValue(summaryPoints);

      const result = await controller.getSummary(mockRequest, 30);

      expect(result).toEqual(summaryPoints);
      expect(service.getSummary).toHaveBeenCalledWith(userId, 30);
      expect(service.getSummary).toHaveBeenCalledTimes(1);
    });

    it('should pass custom limit to the service', async () => {
      mockEvolutionService.getSummary.mockResolvedValue(summaryPoints);

      await controller.getSummary(mockRequest, 10);

      expect(service.getSummary).toHaveBeenCalledWith(userId, 10);
    });

    it('should return empty array when no measurements exist', async () => {
      mockEvolutionService.getSummary.mockResolvedValue([]);

      const result = await controller.getSummary(mockRequest, 30);

      expect(result).toEqual([]);
      expect(service.getSummary).toHaveBeenCalledWith(userId, 30);
    });
  });

  describe('compare', () => {
    const compareResult = {
      from: baseMeasurement,
      to: { ...baseMeasurement, id: toId, measurementDate: '2024-02-01', weight: '78.00' },
      diff: {
        days: 31,
        weight: -2,
        bodyFatPercentage: null,
        leanMass: null,
        fatMass: null,
      },
    };

    it('should return comparison result for the authenticated user', async () => {
      mockEvolutionService.compare.mockResolvedValue(compareResult);

      const result = await controller.compare(mockRequest, fromId, toId);

      expect(result).toEqual(compareResult);
      expect(service.compare).toHaveBeenCalledWith(userId, fromId, toId);
      expect(service.compare).toHaveBeenCalledTimes(1);
    });

    it('should pass fromId and toId to the service', async () => {
      mockEvolutionService.compare.mockResolvedValue(compareResult);

      await controller.compare(mockRequest, fromId, toId);

      expect(service.compare).toHaveBeenCalledWith(userId, fromId, toId);
    });
  });

  describe('getLatest', () => {
    const latestResult = {
      current: { ...baseMeasurement, id: toId, measurementDate: '2024-02-01' },
      previous: baseMeasurement,
      trend: 'improving' as const,
      message: 'Good job! You are losing weight.',
    };

    it('should return the latest measurement with trend for the authenticated user', async () => {
      mockEvolutionService.getLatest.mockResolvedValue(latestResult);

      const result = await controller.getLatest(mockRequest);

      expect(result).toEqual(latestResult);
      expect(service.getLatest).toHaveBeenCalledWith(userId);
      expect(service.getLatest).toHaveBeenCalledTimes(1);
    });

    it('should return unknown trend when only one measurement exists', async () => {
      const unknownResult = {
        current: baseMeasurement,
        previous: null,
        trend: 'unknown' as const,
        message: 'First measurement recorded. Keep tracking your progress!',
      };
      mockEvolutionService.getLatest.mockResolvedValue(unknownResult);

      const result = await controller.getLatest(mockRequest);

      expect(result).toEqual(unknownResult);
      expect(service.getLatest).toHaveBeenCalledWith(userId);
    });
  });
});
