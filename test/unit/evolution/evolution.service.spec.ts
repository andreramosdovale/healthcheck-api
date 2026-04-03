import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvolutionService } from '@/evolution/evolution.service';
import { EvolutionRepository } from '@/evolution/evolution.repository';
import { makeMeasurement, USER_ID, MEASUREMENT_ID } from '@test/stubs/measurement.stub';

describe('EvolutionService', () => {
  let service: EvolutionService;
  let mockRepository: {
    getSummary: jest.Mock;
    findById: jest.Mock;
    findLatestTwo: jest.Mock;
    findPreviousMeasurement: jest.Mock;
  };

  const fromId = MEASUREMENT_ID;
  const toId = '323e4567-e89b-12d3-a456-426614174002';

  beforeEach(async () => {
    mockRepository = {
      getSummary: jest.fn(),
      findById: jest.fn(),
      findLatestTwo: jest.fn(),
      findPreviousMeasurement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvolutionService,
        { provide: EvolutionRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<EvolutionService>(EvolutionService);
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

    it('should return summary points from the repository', async () => {
      mockRepository.getSummary.mockResolvedValue(summaryPoints);

      const result = await service.getSummary(USER_ID, { limit: 30 });

      expect(result).toEqual(summaryPoints);
      expect(mockRepository.getSummary).toHaveBeenCalledWith(USER_ID, { limit: 30 });
    });

    it('should pass custom limit to the repository', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      await service.getSummary(USER_ID, { limit: 10 });

      expect(mockRepository.getSummary).toHaveBeenCalledWith(USER_ID, { limit: 10 });
    });

    it('should forward date filters to the repository', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      await service.getSummary(USER_ID, { limit: 30, from: '2024-01-01', to: '2024-12-31' });

      expect(mockRepository.getSummary).toHaveBeenCalledWith(USER_ID, {
        limit: 30,
        from: '2024-01-01',
        to: '2024-12-31',
      });
    });

    it('should return empty array when repository returns no results', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result = await service.getSummary(USER_ID, { limit: 30 });

      expect(result).toEqual([]);
    });
  });

  describe('compare', () => {
    it('should return a comparison result with all diffs', async () => {
      const from = makeMeasurement({
        id: fromId,
        userId: USER_ID,
        measurementDate: '2024-01-01',
        weight: '80.00',
        bodyFatPercentage: '20.00',
        leanMass: '64.00',
        fatMass: '16.00',
      });
      const to = makeMeasurement({
        id: toId,
        userId: USER_ID,
        measurementDate: '2024-02-01',
        weight: '78.00',
        bodyFatPercentage: '18.00',
        leanMass: '63.96',
        fatMass: '14.04',
      });

      mockRepository.findById
        .mockResolvedValueOnce(from)
        .mockResolvedValueOnce(to);

      const result = await service.compare(USER_ID, fromId, toId);

      expect(result.from).toEqual(from);
      expect(result.to).toEqual(to);
      expect(result.diff.days).toBe(31);
      expect(result.diff.weight).toBe(-2);
      expect(result.diff.bodyFatPercentage).toBe(-2);
      expect(result.diff.leanMass).toBe(-0.04);
      expect(result.diff.fatMass).toBe(-1.96);
    });

    it('should return null diffs when body fat is not available', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId: USER_ID, measurementDate: '2024-01-01' }))
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId: USER_ID, measurementDate: '2024-02-01', weight: '78.00' }));

      const result = await service.compare(USER_ID, fromId, toId);

      expect(result.diff.weight).toBe(-2);
      expect(result.diff.bodyFatPercentage).toBeNull();
      expect(result.diff.leanMass).toBeNull();
      expect(result.diff.fatMass).toBeNull();
    });

    it('should throw NotFoundException when from measurement is not found', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId: USER_ID }));

      await expect(service.compare(USER_ID, fromId, toId)).rejects.toThrow(
        'From measurement not found',
      );
    });

    it('should throw NotFoundException when from measurement belongs to another user', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId: 'other-user-id' }))
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId: USER_ID }));

      await expect(service.compare(USER_ID, fromId, toId)).rejects.toThrow(
        'From measurement not found',
      );
    });

    it('should throw NotFoundException when to measurement is not found', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId: USER_ID }))
        .mockResolvedValueOnce(null);

      await expect(service.compare(USER_ID, fromId, toId)).rejects.toThrow(
        'To measurement not found',
      );
    });

    it('should throw NotFoundException when to measurement belongs to another user', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId: USER_ID }))
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId: 'other-user-id' }));

      await expect(service.compare(USER_ID, fromId, toId)).rejects.toThrow(
        'To measurement not found',
      );
    });

    it('should calculate days correctly between two dates', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(makeMeasurement({ id: fromId, userId: USER_ID, measurementDate: '2024-01-01' }))
        .mockResolvedValueOnce(makeMeasurement({ id: toId, userId: USER_ID, measurementDate: '2024-01-31' }));

      const result = await service.compare(USER_ID, fromId, toId);

      expect(result.diff.days).toBe(30);
    });
  });

  describe('getLatest', () => {
    it('should throw NotFoundException when no measurements exist', async () => {
      mockRepository.findLatestTwo.mockResolvedValue([]);

      await expect(service.getLatest(USER_ID)).rejects.toThrow(NotFoundException);
      await expect(service.getLatest(USER_ID)).rejects.toThrow('No measurements found');
    });

    it('should return null trend and first_measurement trendCode when only one measurement exists', async () => {
      const current = makeMeasurement({ id: fromId, userId: USER_ID });
      mockRepository.findLatestTwo.mockResolvedValue([current]);

      const result = await service.getLatest(USER_ID);

      expect(result.current).toEqual(current);
      expect(result.previous).toBeNull();
      expect(result.trend).toBeNull();
      expect(result.trendCode).toBe('first_measurement');
    });

    it('should set current to first result and previous to second', async () => {
      const current = makeMeasurement({ id: toId, userId: USER_ID, measurementDate: '2024-02-01' });
      const previous = makeMeasurement({ id: fromId, userId: USER_ID });
      mockRepository.findLatestTwo.mockResolvedValue([current, previous]);

      const result = await service.getLatest(USER_ID);

      expect(result.current).toEqual(current);
      expect(result.previous).toEqual(previous);
    });

    describe('trend calculation without body fat data', () => {
      it('should return improving trend and weight_loss trendCode when weight decreased by >= 1 kg', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '78.50' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('improving');
        expect(result.trendCode).toBe('weight_loss');
      });

      it('should return worsening trend and weight_gain trendCode when weight increased by >= 1 kg', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '82.00' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('worsening');
        expect(result.trendCode).toBe('weight_gain');
      });

      it('should return stable trend and weight_stable trendCode when weight change is less than 1 kg', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '80.50' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('stable');
        expect(result.trendCode).toBe('weight_stable');
      });
    });

    describe('trend calculation with body fat data', () => {
      it('should return improving trend and excellent_progress trendCode when body fat decreased by >= 2%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '79.00', bodyFatPercentage: '17.00' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00', bodyFatPercentage: '20.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('improving');
        expect(result.trendCode).toBe('excellent_progress');
      });

      it('should return improving trend and good_progress trendCode when body fat decreased by 1–2%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '79.00', bodyFatPercentage: '19.00' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00', bodyFatPercentage: '20.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('improving');
        expect(result.trendCode).toBe('good_progress');
      });

      it('should return worsening trend and fat_increased trendCode when body fat increased by >= 1%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '81.00', bodyFatPercentage: '21.00' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00', bodyFatPercentage: '20.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('worsening');
        expect(result.trendCode).toBe('fat_increased');
      });

      it('should return stable trend and stable_results trendCode when body fat change is less than 1%', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '80.00', bodyFatPercentage: '20.50' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00', bodyFatPercentage: '20.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        expect(result.trend).toBe('stable');
        expect(result.trendCode).toBe('stable_results');
      });

      it('should prefer bodyFatPercentage over navyBodyFatPercentage for trend', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '79.00', bodyFatPercentage: '17.00', navyBodyFatPercentage: '25.00' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00', bodyFatPercentage: '20.00', navyBodyFatPercentage: '22.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        // bodyFatPercentage: 17 - 20 = -3, excellent_progress
        expect(result.trend).toBe('improving');
        expect(result.trendCode).toBe('excellent_progress');
      });

      it('should fall back to navyBodyFatPercentage when bodyFatPercentage is null', async () => {
        mockRepository.findLatestTwo.mockResolvedValue([
          makeMeasurement({ id: toId, userId: USER_ID, weight: '79.00', bodyFatPercentage: null, navyBodyFatPercentage: '17.00' }),
          makeMeasurement({ id: fromId, userId: USER_ID, weight: '80.00', bodyFatPercentage: null, navyBodyFatPercentage: '20.00' }),
        ]);

        const result = await service.getLatest(USER_ID);

        // navyBodyFatPercentage: 17 - 20 = -3, excellent_progress
        expect(result.trend).toBe('improving');
        expect(result.trendCode).toBe('excellent_progress');
      });
    });
  });

  describe('getDelta', () => {
    it('should return delta with directions when current and previous measurements exist', async () => {
      const current = makeMeasurement({ id: toId, userId: USER_ID, measurementDate: '2024-02-01', weight: '78.00' });
      const previous = makeMeasurement({ id: fromId, userId: USER_ID, measurementDate: '2024-01-15', weight: '80.00' });

      mockRepository.findById.mockResolvedValue(current);
      mockRepository.findPreviousMeasurement.mockResolvedValue(previous);

      const result = await service.getDelta(USER_ID, toId);

      expect(result.measurementId).toBe(toId);
      expect(result.previousMeasurementId).toBe(fromId);
      expect(result.delta).not.toBeNull();
      expect(result.delta!.weight).toBe('down');
    });

    it('should return null delta when there is no previous measurement', async () => {
      const current = makeMeasurement({ id: toId, userId: USER_ID });
      mockRepository.findById.mockResolvedValue(current);
      mockRepository.findPreviousMeasurement.mockResolvedValue(null);

      const result = await service.getDelta(USER_ID, toId);

      expect(result.measurementId).toBe(toId);
      expect(result.previousMeasurementId).toBeNull();
      expect(result.delta).toBeNull();
    });

    it('should throw NotFoundException when measurement is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getDelta(USER_ID, toId)).rejects.toThrow(NotFoundException);
      await expect(service.getDelta(USER_ID, toId)).rejects.toThrow('Measurement not found');
    });

    it('should throw NotFoundException when measurement belongs to another user', async () => {
      mockRepository.findById.mockResolvedValue(
        makeMeasurement({ id: toId, userId: 'other-user-id' }),
      );

      await expect(service.getDelta(USER_ID, toId)).rejects.toThrow('Measurement not found');
    });

    describe('compositionBalance', () => {
      it('should return null when no composition data is available', async () => {
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBeNull();
      });

      it('should return up when lean mass increased and fat mass decreased', async () => {
        // leanMass: 60 → 62 (+2kg, > 0.2 threshold) → +2 score
        // fatMass: 20 → 18 (-2kg, > 0.2 threshold) → +2 score
        // total score = +4 → 'up'
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, leanMass: '62.00', fatMass: '18.00' }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, leanMass: '60.00', fatMass: '20.00' }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('up');
      });

      it('should return down when lean mass decreased and fat mass increased', async () => {
        // leanMass: 62 → 60 (-2kg) → -2 score
        // fatMass: 18 → 20 (+2kg) → -2 score
        // total score = -4 → 'down'
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, leanMass: '60.00', fatMass: '20.00' }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, leanMass: '62.00', fatMass: '18.00' }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('down');
      });

      it('should return up when skinfold sum decreased', async () => {
        // all skinfolds: 20 → 10 (sum: 140 → 70, diff = -70 > 2mm threshold) → +1 score
        const highSkinfolds = { triceps: '20.00', subscapular: '20.00', chest: '20.00', midaxillary: '20.00', suprailiac: '20.00', abdominal: '20.00', thigh: '20.00' };
        const lowSkinfolds  = { triceps: '10.00', subscapular: '10.00', chest: '10.00', midaxillary: '10.00', suprailiac: '10.00', abdominal: '10.00', thigh: '10.00' };

        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, ...lowSkinfolds }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, ...highSkinfolds }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('up');
      });

      it('should return down when skinfold sum increased', async () => {
        const lowSkinfolds  = { triceps: '10.00', subscapular: '10.00', chest: '10.00', midaxillary: '10.00', suprailiac: '10.00', abdominal: '10.00', thigh: '10.00' };
        const highSkinfolds = { triceps: '20.00', subscapular: '20.00', chest: '20.00', midaxillary: '20.00', suprailiac: '20.00', abdominal: '20.00', thigh: '20.00' };

        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, ...highSkinfolds }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, ...lowSkinfolds }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('down');
      });

      it('should return up when raw WHR improved (ratio decreased)', async () => {
        // previous: 90/100 = 0.90, current: 88/100 = 0.88 → diff = -0.02 > 0.01 threshold → +1 score
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, waist: '88.00', hip: '100.00' }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, waist: '90.00', hip: '100.00' }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('up');
      });

      it('should return down when raw WHR worsened (ratio increased)', async () => {
        // previous: 88/100 = 0.88, current: 90/100 = 0.90 → diff = +0.02 → -1 score
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, waist: '90.00', hip: '100.00' }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, waist: '88.00', hip: '100.00' }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('down');
      });

      it('should return null for WHR signal when waist or hip is missing', async () => {
        // only waist present, no hip → WHR signal = null → no signals at all → null
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, waist: '90.00' }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, waist: '88.00' }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBeNull();
      });

      it('should return stable when opposing signals cancel out', async () => {
        // leanMass up (+2) and fatMass up (-2) → score = 0, but has signals → 'stable'
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, leanMass: '62.00', fatMass: '20.00' }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, leanMass: '60.00', fatMass: '18.00' }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('stable');
      });

      it('should return up when mixed signals resolve positively', async () => {
        // leanMass up (+2), fatMass up (-2), skinfoldSum down (+1) → score = +1 → 'up'
        const lowSkinfolds  = { triceps: '10.00', subscapular: '10.00', chest: '10.00', midaxillary: '10.00', suprailiac: '10.00', abdominal: '10.00', thigh: '10.00' };
        const highSkinfolds = { triceps: '20.00', subscapular: '20.00', chest: '20.00', midaxillary: '20.00', suprailiac: '20.00', abdominal: '20.00', thigh: '20.00' };

        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ id: toId, userId: USER_ID, leanMass: '62.00', fatMass: '20.00', ...lowSkinfolds }),
        );
        mockRepository.findPreviousMeasurement.mockResolvedValue(
          makeMeasurement({ id: fromId, userId: USER_ID, leanMass: '60.00', fatMass: '18.00', ...highSkinfolds }),
        );

        const result = await service.getDelta(USER_ID, toId);

        expect(result.delta!.compositionBalance).toBe('up');
      });
    });
  });
});
