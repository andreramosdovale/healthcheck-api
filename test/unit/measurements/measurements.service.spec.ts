import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MeasurementsService } from '@/measurements/measurements.service';
import { MeasurementsRepository } from '@/measurements/measurements.repository';
import {
  makeMeasurement,
  makeMeasurementResponse,
  makeUserForMeasurement,
  makeCreateMeasurementInput,
  makeListMeasurementsInput,
  USER_ID,
  MEASUREMENT_ID,
} from '@test/stubs/measurement.stub';

type MockMeasurementsRepository = {
  findUserById: jest.Mock;
  findAllByUser: jest.Mock;
  findById: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  let mockRepository: MockMeasurementsRepository;

  const allSkinfoldInput = {
    triceps: 10,
    subscapular: 12,
    chest: 8,
    midaxillary: 9,
    suprailiac: 11,
    abdominal: 15,
    thigh: 13,
  };

  beforeEach(async () => {
    mockRepository = {
      findUserById: jest.fn(),
      findAllByUser: jest.fn(),
      findById: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementsService,
        { provide: MeasurementsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MeasurementsService>(MeasurementsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should insert a measurement with weight only and return a MeasurementResponse', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.insert.mockResolvedValue(makeMeasurement());

      const result = await service.create(USER_ID, makeCreateMeasurementInput());

      expect(result).toEqual(makeMeasurementResponse());
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, weight: '80' }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(
        service.create(USER_ID, makeCreateMeasurementInput()),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(USER_ID, makeCreateMeasurementInput()),
      ).rejects.toThrow('User not found');
      expect(mockRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when only some skinfolds are provided', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      const partialSkinfolds = makeCreateMeasurementInput({
        triceps: 10,
        subscapular: 12,
      });

      await expect(service.create(USER_ID, partialSkinfolds)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(USER_ID, partialSkinfolds)).rejects.toThrow(
        'All 7 skinfold fields must be provided together or none at all.',
      );
      expect(mockRepository.insert).not.toHaveBeenCalled();
    });

    it('should pass bodyFatPercentage via Pollock for male with all skinfolds', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'male' }));
      mockRepository.insert.mockResolvedValue(makeMeasurement());

      await service.create(USER_ID, makeCreateMeasurementInput(allSkinfoldInput));

      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          bodyFatPercentage: expect.any(String),
          leanMass: expect.any(String),
          fatMass: expect.any(String),
        }),
      );
      const insertArg = mockRepository.insert.mock.calls[0][0];
      expect(parseFloat(insertArg.bodyFatPercentage)).toBeGreaterThan(0);
      // null?.toString() yields undefined — the navy field is absent when Pollock runs
      expect(insertArg.navyBodyFatPercentage).toBeUndefined();
    });

    it('should pass bodyFatPercentage via Pollock for female with all skinfolds', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'female' }));
      mockRepository.insert.mockResolvedValue(makeMeasurement());

      await service.create(USER_ID, makeCreateMeasurementInput(allSkinfoldInput));

      const insertArg = mockRepository.insert.mock.calls[0][0];
      expect(parseFloat(insertArg.bodyFatPercentage)).toBeGreaterThan(0);
    });

    it('should calculate Navy body fat for male with neck and waist', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'male' }));
      mockRepository.insert.mockResolvedValue(makeMeasurement());

      await service.create(
        USER_ID,
        makeCreateMeasurementInput({ neck: 38, waist: 85 }),
      );

      const insertArg = mockRepository.insert.mock.calls[0][0];
      // Pollock not run (no skinfolds), so bodyFatPercentage is undefined (null?.toString())
      expect(insertArg.bodyFatPercentage).toBeUndefined();
      expect(parseFloat(insertArg.navyBodyFatPercentage)).toBeGreaterThan(0);
    });

    it('should calculate Navy body fat for female with neck, waist and hip', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'female' }));
      mockRepository.insert.mockResolvedValue(makeMeasurement());

      await service.create(
        USER_ID,
        makeCreateMeasurementInput({ neck: 33, waist: 72, hip: 96 }),
      );

      const insertArg = mockRepository.insert.mock.calls[0][0];
      expect(parseFloat(insertArg.navyBodyFatPercentage)).toBeGreaterThan(0);
    });

    it('should not calculate Navy body fat for female without hip', async () => {
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'female' }));
      mockRepository.insert.mockResolvedValue(makeMeasurement());

      await service.create(
        USER_ID,
        makeCreateMeasurementInput({ neck: 33, waist: 72 }),
      );

      const insertArg = mockRepository.insert.mock.calls[0][0];
      // Navy not calculated (missing hip), navyBodyFatPercentage is undefined (null?.toString())
      expect(insertArg.navyBodyFatPercentage).toBeUndefined();
    });
  });

  describe('findAllByUser', () => {
    it('should return mapped MeasurementResponse list', async () => {
      const filters = makeListMeasurementsInput();
      mockRepository.findAllByUser.mockResolvedValue([
        makeMeasurement({ measurementDate: '2024-01-15' }),
        makeMeasurement({ id: 'another-id', measurementDate: '2024-01-10' }),
      ]);
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

      const result = await service.findAllByUser(USER_ID, filters);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('triceps');
      expect(result[0]).toHaveProperty('skinfolds');
      expect(result[0]).toHaveProperty('calculated');
      expect(mockRepository.findAllByUser).toHaveBeenCalledWith(USER_ID, filters);
    });

    it('should return empty array when user has no measurements', async () => {
      mockRepository.findAllByUser.mockResolvedValue([]);
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

      const result = await service.findAllByUser(USER_ID, makeListMeasurementsInput());

      expect(result).toEqual([]);
    });

    it('should forward date filters to the repository', async () => {
      const filters = makeListMeasurementsInput({ from: '2024-01-01', to: '2024-01-31' });
      mockRepository.findAllByUser.mockResolvedValue([]);
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

      await service.findAllByUser(USER_ID, filters);

      expect(mockRepository.findAllByUser).toHaveBeenCalledWith(USER_ID, filters);
    });
  });

  describe('findOne', () => {
    it('should return a MeasurementResponse when measurement is found', async () => {
      mockRepository.findById.mockResolvedValue(makeMeasurement());
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

      const result = await service.findOne(MEASUREMENT_ID, USER_ID);

      expect(result).toEqual(makeMeasurementResponse());
      expect(mockRepository.findById).toHaveBeenCalledWith(MEASUREMENT_ID, USER_ID);
    });

    it('should throw NotFoundException when measurement is not found or belongs to another user', async () => {
      mockRepository.findById.mockResolvedValue(null);
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

      await expect(service.findOne('non-existent-id', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id', USER_ID)).rejects.toThrow(
        'Measurement not found',
      );
    });

    describe('leanMassPercentage', () => {
      it('should compute leanMassPercentage from Pollock bodyFatPercentage', async () => {
        // bodyFatPercentage = 20% → leanMassPercentage = 80%
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ bodyFatPercentage: '20.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.leanMassPercentage).toBe(80);
      });

      it('should compute leanMassPercentage from Navy navyBodyFatPercentage when Pollock is absent', async () => {
        // navyBodyFatPercentage = 25% → leanMassPercentage = 75%
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ navyBodyFatPercentage: '25.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.leanMassPercentage).toBe(75);
      });

      it('should return leanMassPercentage null when no body fat data is available', async () => {
        mockRepository.findById.mockResolvedValue(makeMeasurement());
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.leanMassPercentage).toBeNull();
      });
    });

    describe('waistHipRatio', () => {
      it('should compute waistHipRatio when waist and hip are present', async () => {
        // waist = 85, hip = 100 → ratio = 0.85
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ waist: '85.00', hip: '100.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'male' }));

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.waistHipRatio).not.toBeNull();
        expect(result.calculated.waistHipRatio!.value).toBe(0.85);
      });

      it('should classify risk using user sex — male low risk when ratio < 0.90', async () => {
        // waist = 85, hip = 100 → ratio = 0.85 → male low
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ waist: '85.00', hip: '100.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'male' }));

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.waistHipRatio!.risk).toBe('low');
      });

      it('should classify risk using user sex — female moderate risk when ratio is 0.80–0.85', async () => {
        // waist = 82, hip = 100 → ratio = 0.82 → female moderate
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ waist: '82.00', hip: '100.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement({ sex: 'female' }));

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.waistHipRatio!.risk).toBe('moderate');
      });

      it('should return waistHipRatio null when waist is missing', async () => {
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ hip: '100.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.waistHipRatio).toBeNull();
      });

      it('should return waistHipRatio null when hip is missing', async () => {
        mockRepository.findById.mockResolvedValue(
          makeMeasurement({ waist: '85.00' }),
        );
        mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

        const result = await service.findOne(MEASUREMENT_ID, USER_ID);

        expect(result.calculated.waistHipRatio).toBeNull();
      });
    });
  });

  describe('update', () => {
    it('should update and return MeasurementResponse when successful', async () => {
      const updatedRaw = makeMeasurement({ weight: '82.00' });
      mockRepository.findById.mockResolvedValue(makeMeasurement());
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.update.mockResolvedValue(updatedRaw);

      const result = await service.update(MEASUREMENT_ID, USER_ID, { weight: 82 });

      expect(result.weight).toBe(82);
      expect(mockRepository.update).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        USER_ID,
        expect.objectContaining({ weight: '82' }),
      );
    });

    it('should throw NotFoundException when measurement is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', USER_ID, { weight: 82 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent-id', USER_ID, { weight: 82 }),
      ).rejects.toThrow('Measurement not found');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockRepository.findById.mockResolvedValue(makeMeasurement());
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(
        service.update(MEASUREMENT_ID, USER_ID, { weight: 82 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(MEASUREMENT_ID, USER_ID, { weight: 82 }),
      ).rejects.toThrow('User not found');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete the measurement when it exists', async () => {
      mockRepository.findById.mockResolvedValue(makeMeasurement());
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(MEASUREMENT_ID, USER_ID);

      expect(mockRepository.delete).toHaveBeenCalledWith(MEASUREMENT_ID, USER_ID);
    });

    it('should throw NotFoundException when measurement is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      mockRepository.findUserById.mockResolvedValue(makeUserForMeasurement());

      await expect(service.remove('non-existent-id', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
