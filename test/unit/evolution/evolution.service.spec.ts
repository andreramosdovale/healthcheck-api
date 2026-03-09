import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvolutionService } from '@/evolution/evolution.service';
import { EvolutionRepository } from '@/evolution/evolution.repository';
import { makeMeasurement } from '@test/stubs/measurement.stub';

describe('EvolutionService', () => {
  let service: EvolutionService;
  let mockRepository: {
    getSummary: jest.Mock;
    findById: jest.Mock;
    findLatestTwo: jest.Mock;
  };

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const fromId = '223e4567-e89b-12d3-a456-426614174001';
  const toId = '323e4567-e89b-12d3-a456-426614174002';

  beforeEach(async () => {
    mockRepository = {
      getSummary: jest.fn(),
      findById: jest.fn(),
      findLatestTwo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvolutionService,
        { provide: EvolutionRepository, useValue: mockRepository },
      ],
    }).compile();

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
        navyBodyFatPercentage: 16,
        leanMass: 66.53,
        fatMass: 11.97,
      },
    ];

    it('should return summary points from the repository', async () => {
      mockRepository.getSummary.mockResolvedValue(summaryPoints);

      const result = await service.getSummary(userId);

      expect(result).toEqual(summaryPoints);
      expect(mockRepository.getSummary).toHaveBeenCalledWith(userId, 30);
    });

    it('should pass custom limit to the repository', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      await service.getSummary(userId, 10);

      expect(mockRepository.getSummary).toHaveBeenCalledWith(userId, 10);
    });

    it('should use default limit of 30', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      await service.getSummary(userId);

      expect(mockRepository.getSummary).toHaveBeenCalledWith(userId, 30);
    });

    it('should return empty array when repository returns no results', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result).toEqual([]);
    });
  });

  describe('compare', () => {
    it('should return a comparison result with all diffs', async () => {
      const from = makeMeasurement({
        id: fromId,
        userId,
        measurementDate: '2024-01-01',
        weight: '80.00',
        bodyFatPercentage: '20.00',
        leanMass: '64.00',
        fatMass: '16.00',
      });
      const to = makeMeasurement({
        id: toId,
        userId,
        measurementDate: '2024-02-01',
        weight: '78.00',
        bodyFatPercentage: '18.00',
        leanMass: '63.96',
        fatMass: '14.04',
      });

      mockRepository.findById
        .mockResolvedValueOnce(from)
        .mockResolvedValueOnce(to);

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
      const from = makeMeasurement({ id: fromId, userId, weight: '80.00' });
      const to = makeMeasurement({
        id: toId,
        userId,
        weight: '78.00',
        measurementDate: '2024-02-01',
      });

      mockRepository.findById
        .mockResolvedValueOnce(from)
        .mockResolvedValueOnce(to);

      const result = await service.compare(userId, fromId, toId);

      expect(result.diff.weight).toBe(-2);
      expect(result.diff.bodyFatPercentage).toBeNull();
      expect(result.diff.leanMass).toBeNull();
      expect(result.diff.fatMass).toBeNull();
    });

    it('should throw NotFoundException when from measurement is not found', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId }));

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'From measurement not found',
      );
    });

    it('should throw NotFoundException when from measurement belongs to another user', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(
          makeMeasurement({ id: fromId, userId: 'other-user-id' }),
        )
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId }));

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'From measurement not found',
      );
    });

    it('should throw NotFoundException when to measurement is not found', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId }))
        .mockResolvedValueOnce(null);

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'To measurement not found',
      );
    });

    it('should throw NotFoundException when to measurement belongs to another user', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId }))
        .mockResolvedValueOnce(
          makeMeasurement({ id: toId, userId: 'other-user-id' }),
        );

      await expect(service.compare(userId, fromId, toId)).rejects.toThrow(
        'To measurement not found',
      );
    });

    it('should calculate days correctly between two dates', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(
          makeMeasurement({
            id: fromId,
            userId,
            measurementDate: '2024-01-01',
          }),
        )
        .mockResolvedValueOnce(
          makeMeasurement({
            id: toId,
            userId,
            measurementDate: '2024-01-31',
          }),
        );

      const result = await service.compare(userId, fromId, toId);

      expect(result.diff.days).toBe(30);
    });
  });

  describe('getLatest', () => {
    it('should throw NotFoundException when no measurements exist', async () => {
      mockRepository.findLatestTwo.mockResolvedValue([]);

      await expect(service.getLatest(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLatest(userId)).rejects.toThrow(
        'No measurements found',
      );
    });

    it('should return unknown trend when only one measurement exists', async () => {
      const current = makeMeasurement({ id: fromId, userId });
      mockRepository.findLatestTwo.mockResolvedValue([current]);

      const result = await service.getLatest(userId);

      expect(result.current).toEqual(current);
      expect(result.previous).toBeNull();
      expect(result.trend).toBe('unknown');
      expect(result.message).toBe(
        'First measurement recorded. Keep tracking your progress!',
      );
    });

    it('should set current to first result and previous to second', async () => {
      const current = makeMeasurement({
        id: toId,
        userId,
        measurementDate: '2024-02-01',
      });
      const previous = makeMeasurement({ id: fromId, userId });
      mockRepository.findLatestTwo.mockResolvedValue([current, previous]);

      const result = await service.getLatest(userId);

      expect(result.current).toEqual(current);
      expect(result.previous).toEqual(previous);
    });

    describe('trend calculation without body fat data', () => {
      it('should return improving trend when weight decreased by >= 1 kg', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId, weight: '78.50' }),
          makeMeasurement({ id: fromId, userId, weight: '80.00' }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('improving');
        expect(result.message).toBe('Good job! You are losing weight.');
      });

      it('should return worsening trend when weight increased by >= 1 kg', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId, weight: '82.00' }),
          makeMeasurement({ id: fromId, userId, weight: '80.00' }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('worsening');
        expect(result.message).toBe('Weight increased. Review your routine.');
      });

      it('should return stable trend when weight change is less than 1 kg', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId, weight: '80.50' }),
          makeMeasurement({ id: fromId, userId, weight: '80.00' }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('stable');
        expect(result.message).toBe('Weight is stable. Keep going!');
      });
    });

    describe('trend calculation with body fat data', () => {
      it('should return excellent improving trend when body fat decreased by >= 2%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({
            id: toId,
            userId,
            weight: '79.00',
            bodyFatPercentage: '17.00',
          }),
          makeMeasurement({
            id: fromId,
            userId,
            weight: '80.00',
            bodyFatPercentage: '20.00',
          }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('improving');
        expect(result.message).toBe(
          'Excellent progress! You are on the right track!',
        );
      });

      it('should return good improving trend when body fat decreased by 1–2%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({
            id: toId,
            userId,
            weight: '79.00',
            bodyFatPercentage: '19.00',
          }),
          makeMeasurement({
            id: fromId,
            userId,
            weight: '80.00',
            bodyFatPercentage: '20.00',
          }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('improving');
        expect(result.message).toBe('Good job! Keep it up!');
      });

      it('should return worsening trend when body fat increased by >= 1%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({
            id: toId,
            userId,
            weight: '81.00',
            bodyFatPercentage: '21.00',
          }),
          makeMeasurement({
            id: fromId,
            userId,
            weight: '80.00',
            bodyFatPercentage: '20.00',
          }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('worsening');
        expect(result.message).toBe(
          'Body fat increased. Consider adjusting your routine.',
        );
      });

      it('should return stable trend when body fat change is less than 1%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({
            id: toId,
            userId,
            weight: '80.00',
            bodyFatPercentage: '20.50',
          }),
          makeMeasurement({
            id: fromId,
            userId,
            weight: '80.00',
            bodyFatPercentage: '20.00',
          }),
        ]);

        const result = await service.getLatest(userId);

        expect(result.trend).toBe('stable');
        expect(result.message).toBe(
          'You are maintaining your results. Consider adjusting to improve.',
        );
      });

      it('should prefer bodyFatPercentage over navyBodyFatPercentage for trend', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({
            id: toId,
            userId,
            weight: '79.00',
            bodyFatPercentage: '17.00',
            navyBodyFatPercentage: '25.00',
          }),
          makeMeasurement({
            id: fromId,
            userId,
            weight: '80.00',
            bodyFatPercentage: '20.00',
            navyBodyFatPercentage: '22.00',
          }),
        ]);

        const result = await service.getLatest(userId);

        // bodyFatPercentage: 17 - 20 = -3, so "excellent improving"
        expect(result.trend).toBe('improving');
        expect(result.message).toBe(
          'Excellent progress! You are on the right track!',
        );
      });

      it('should fall back to navyBodyFatPercentage when bodyFatPercentage is null', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({
            id: toId,
            userId,
            weight: '79.00',
            bodyFatPercentage: null,
            navyBodyFatPercentage: '17.00',
          }),
          makeMeasurement({
            id: fromId,
            userId,
            weight: '80.00',
            bodyFatPercentage: null,
            navyBodyFatPercentage: '20.00',
          }),
        ]);

        const result = await service.getLatest(userId);

        // navyBodyFatPercentage: 17 - 20 = -3, so "excellent improving"
        expect(result.trend).toBe('improving');
      });
    });
  });
});
