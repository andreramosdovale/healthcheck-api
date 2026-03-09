import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvolutionService } from '@/evolution/evolution.service';
import { DRIZZLE } from '@/database/drizzle.module';

type MockDb = {
  select: jest.Mock;
};

describe('EvolutionService', () => {
  let service: EvolutionService;
  let mockDb: MockDb;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const fromId = '223e4567-e89b-12d3-a456-426614174001';
  const toId = '323e4567-e89b-12d3-a456-426614174002';

  const baseMeasurement = {
    id: fromId,
    userId,
    measurementDate: '2024-01-01',
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

  const laterMeasurement = {
    ...baseMeasurement,
    id: toId,
    measurementDate: '2024-02-01',
    weight: '78.00',
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvolutionService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<EvolutionService>(EvolutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    const dbRows = [
      {
        date: '2024-01-01',
        weight: '80.00',
        bodyFatPercentage: null,
        navyBodyFatPercentage: null,
        leanMass: null,
        fatMass: null,
      },
      {
        date: '2024-02-01',
        weight: '78.50',
        bodyFatPercentage: '15.20',
        navyBodyFatPercentage: '16.00',
        leanMass: '66.53',
        fatMass: '11.97',
      },
    ];

    it('should return mapped summary points', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(dbRows),
      });

      const result = await service.getSummary(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        weight: 80,
        bodyFatPercentage: null,
        navyBodyFatPercentage: null,
        leanMass: null,
        fatMass: null,
      });
      expect(result[1]).toEqual({
        date: '2024-02-01',
        weight: 78.5,
        bodyFatPercentage: 15.2,
        navyBodyFatPercentage: 16,
        leanMass: 66.53,
        fatMass: 11.97,
      });
    });

    it('should return empty array when user has no measurements', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getSummary(userId);

      expect(result).toEqual([]);
    });

    it('should pass the limit to the query', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: limitMock,
      });

      await service.getSummary(userId, 10);

      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it('should use default limit of 30', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: limitMock,
      });

      await service.getSummary(userId);

      expect(limitMock).toHaveBeenCalledWith(30);
    });

    it('should parse numeric string fields to floats', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([dbRows[1]]),
      });

      const result = await service.getSummary(userId);

      expect(typeof result[0].weight).toBe('number');
      expect(typeof result[0].bodyFatPercentage).toBe('number');
      expect(typeof result[0].leanMass).toBe('number');
      expect(typeof result[0].fatMass).toBe('number');
    });
  });

  describe('compare', () => {
    it('should return a comparison result with all diffs', async () => {
      const from = {
        ...baseMeasurement,
        id: fromId,
        measurementDate: '2024-01-01',
        weight: '80.00',
        bodyFatPercentage: '20.00',
        leanMass: '64.00',
        fatMass: '16.00',
      };
      const to = {
        ...baseMeasurement,
        id: toId,
        measurementDate: '2024-02-01',
        weight: '78.00',
        bodyFatPercentage: '18.00',
        leanMass: '63.96',
        fatMass: '14.04',
      };

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([from]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([to]),
        });

      const result = await service.compare(userId, fromId, toId);

      expect(result.from).toEqual(from);
      expect(result.to).toEqual(to);
      expect(result.diff.days).toBe(31);
      expect(result.diff.weight).toBe(-2);
      expect(result.diff.bodyFatPercentage).toBe(-2);
      expect(result.diff.leanMass).toBe(-0.04);
      expect(result.diff.fatMass).toBe(-1.96);
    });

    it('should return null diffs when body fat is not available', async () => {
      const from = { ...baseMeasurement, id: fromId, weight: '80.00' };
      const to = {
        ...baseMeasurement,
        id: toId,
        weight: '78.00',
        measurementDate: '2024-02-01',
      };

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([from]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([to]),
        });

      const result = await service.compare(userId, fromId, toId);

      expect(result.diff.weight).toBe(-2);
      expect(result.diff.bodyFatPercentage).toBeNull();
      expect(result.diff.leanMass).toBeNull();
      expect(result.diff.fatMass).toBeNull();
    });

    it('should throw NotFoundException when from measurement is not found', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([laterMeasurement]),
        });

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'From measurement not found',
      );
    });

    it('should throw NotFoundException when from measurement belongs to another user', async () => {
      const otherUserMeasurement = {
        ...baseMeasurement,
        userId: 'other-user-id',
      };

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([otherUserMeasurement]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([laterMeasurement]),
        });

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'From measurement not found',
      );
    });

    it('should throw NotFoundException when to measurement is not found', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([baseMeasurement]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
        });

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'To measurement not found',
      );
    });

    it('should throw NotFoundException when to measurement belongs to another user', async () => {
      const otherUserMeasurement = {
        ...laterMeasurement,
        userId: 'other-user-id',
      };

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([baseMeasurement]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([otherUserMeasurement]),
        });

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'To measurement not found',
      );
    });

    it('should calculate days correctly between two dates', async () => {
      const from = { ...baseMeasurement, measurementDate: '2024-01-01' };
      const to = {
        ...baseMeasurement,
        id: toId,
        measurementDate: '2024-01-31',
      };

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([from]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([to]),
        });

      const result = await service.compare(userId, fromId, toId);

      expect(result.diff.days).toBe(30);
    });
  });

  describe('getLatest', () => {
    it('should throw NotFoundException when no measurements exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await expect(service.getLatest(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLatest(userId)).rejects.toThrow(
        'No measurements found',
      );
    });

    it('should return unknown trend when only one measurement exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([baseMeasurement]),
      });

      const result = await service.getLatest(userId);

      expect(result.current).toEqual(baseMeasurement);
      expect(result.previous).toBeNull();
      expect(result.trend).toBe('unknown');
      expect(result.message).toBe(
        'First measurement recorded. Keep tracking your progress!',
      );
    });

    describe('trend calculation without body fat data', () => {
      it('should return improving trend when weight decreased by >= 1 kg', async () => {
        const current = { ...baseMeasurement, id: toId, weight: '78.50' };
        const previous = { ...baseMeasurement, weight: '80.00' };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('improving');
        expect(result.message).toBe('Good job! You are losing weight.');
      });

      it('should return worsening trend when weight increased by >= 1 kg', async () => {
        const current = { ...baseMeasurement, id: toId, weight: '82.00' };
        const previous = { ...baseMeasurement, weight: '80.00' };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('worsening');
        expect(result.message).toBe('Weight increased. Review your routine.');
      });

      it('should return stable trend when weight change is less than 1 kg', async () => {
        const current = { ...baseMeasurement, id: toId, weight: '80.50' };
        const previous = { ...baseMeasurement, weight: '80.00' };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('stable');
        expect(result.message).toBe('Weight is stable. Keep going!');
      });
    });

    describe('trend calculation with body fat data', () => {
      it('should return excellent improving trend when body fat decreased by >= 2%', async () => {
        const current = {
          ...baseMeasurement,
          id: toId,
          weight: '79.00',
          bodyFatPercentage: '17.00',
        };
        const previous = {
          ...baseMeasurement,
          weight: '80.00',
          bodyFatPercentage: '20.00',
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('improving');
        expect(result.message).toBe(
          'Excellent progress! You are on the right track!',
        );
      });

      it('should return good improving trend when body fat decreased by 1–2%', async () => {
        const current = {
          ...baseMeasurement,
          id: toId,
          weight: '79.00',
          bodyFatPercentage: '19.00',
        };
        const previous = {
          ...baseMeasurement,
          weight: '80.00',
          bodyFatPercentage: '20.00',
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('improving');
        expect(result.message).toBe('Good job! Keep it up!');
      });

      it('should return worsening trend when body fat increased by >= 1%', async () => {
        const current = {
          ...baseMeasurement,
          id: toId,
          weight: '81.00',
          bodyFatPercentage: '21.00',
        };
        const previous = {
          ...baseMeasurement,
          weight: '80.00',
          bodyFatPercentage: '20.00',
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('worsening');
        expect(result.message).toBe(
          'Body fat increased. Consider adjusting your routine.',
        );
      });

      it('should return stable trend when body fat change is less than 1%', async () => {
        const current = {
          ...baseMeasurement,
          id: toId,
          weight: '80.00',
          bodyFatPercentage: '20.50',
        };
        const previous = {
          ...baseMeasurement,
          weight: '80.00',
          bodyFatPercentage: '20.00',
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('stable');
        expect(result.message).toBe(
          'You are maintaining your results. Consider adjusting to improve.',
        );
      });

      it('should prefer bodyFatPercentage over navyBodyFatPercentage for trend', async () => {
        const current = {
          ...baseMeasurement,
          id: toId,
          weight: '79.00',
          bodyFatPercentage: '17.00',
          navyBodyFatPercentage: '25.00',
        };
        const previous = {
          ...baseMeasurement,
          weight: '80.00',
          bodyFatPercentage: '20.00',
          navyBodyFatPercentage: '22.00',
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        // bodyFatPercentage: 17 - 20 = -3, so "excellent improving"
        expect(result.trend).toBe('improving');
        expect(result.message).toBe(
          'Excellent progress! You are on the right track!',
        );
      });

      it('should fall back to navyBodyFatPercentage when bodyFatPercentage is null', async () => {
        const current = {
          ...baseMeasurement,
          id: toId,
          weight: '79.00',
          bodyFatPercentage: null,
          navyBodyFatPercentage: '17.00',
        };
        const previous = {
          ...baseMeasurement,
          weight: '80.00',
          bodyFatPercentage: null,
          navyBodyFatPercentage: '20.00',
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([current, previous]),
        });

        const result = await service.getLatest(userId);

        // navyBodyFatPercentage: 17 - 20 = -3, so "excellent improving"
        expect(result.trend).toBe('improving');
      });
    });

    it('should set current to first result and previous to second', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([laterMeasurement, baseMeasurement]),
      });

      const result = await service.getLatest(userId);

      expect(result.current).toEqual(laterMeasurement);
      expect(result.previous).toEqual(baseMeasurement);
    });
  });
});
