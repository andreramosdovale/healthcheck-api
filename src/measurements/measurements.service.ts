import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MeasurementsRepository } from './measurements.repository';
import type {
  MeasurementUpdateData,
  CreateMeasurementInput,
  UpdateMeasurementInput,
  ListMeasurementsInput,
  MeasurementResponse,
} from './types/measurements.types';
import {
  calculateAge,
  calculatePollockBodyFat,
  calculateNavyBodyFat,
  hasAllSkinfolds,
  canCalculateNavyMale,
  canCalculateNavyFemale,
} from './utils/body-fat-calculator';
import { toMeasurementResponse } from './utils/measurement.mapper';

type DtoUpdateValues = Omit<
  MeasurementUpdateData,
  | 'updatedAt'
  | 'bodyFatPercentage'
  | 'navyBodyFatPercentage'
  | 'leanMass'
  | 'fatMass'
>;

const SKINFOLD_FIELDS = [
  'triceps',
  'subscapular',
  'chest',
  'midaxillary',
  'suprailiac',
  'abdominal',
  'thigh',
] as const;

@Injectable()
export class MeasurementsService {
  constructor(
    private readonly measurementsRepository: MeasurementsRepository,
  ) {}

  async create(
    userId: string,
    input: CreateMeasurementInput,
  ): Promise<MeasurementResponse> {
    const user = await this.measurementsRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasAnySkinfold = SKINFOLD_FIELDS.some((f) => input[f] !== undefined);

    if (hasAnySkinfold && !hasAllSkinfolds(input)) {
      const missingFields = SKINFOLD_FIELDS.filter((f) => input[f] === undefined);
      throw new BadRequestException({
        message: 'All 7 skinfold fields must be provided together or none at all.',
        errorCode: 'SKINFOLDS_INCOMPLETE',
        missingFields,
      });
    }

    const age = calculateAge(user.birthDate, input.measurementDate);

    let bodyFatPercentage: number | null = null;
    let navyBodyFatPercentage: number | null = null;
    let leanMass: number | null = null;
    let fatMass: number | null = null;

    if (hasAllSkinfolds(input)) {
      const pollockResult = calculatePollockBodyFat(input, age, user.sex, input.weight);

      if (pollockResult) {
        bodyFatPercentage = pollockResult.bodyFatPercentage;
        leanMass = pollockResult.leanMass;
        fatMass = pollockResult.fatMass;
      }
    }

    const height = parseFloat(user.height);
    const navyInput = {
      neck: input.neck ?? undefined,
      waist: input.waist ?? undefined,
      hip: input.hip ?? undefined,
      height,
    };

    const canCalculateNavy =
      user.sex === 'male'
        ? canCalculateNavyMale(navyInput)
        : canCalculateNavyFemale(navyInput);

    if (canCalculateNavy) {
      const navyResult = calculateNavyBodyFat(
        { neck: navyInput.neck!, waist: navyInput.waist!, hip: navyInput.hip, height },
        user.sex,
        input.weight,
      );

      if (navyResult) {
        navyBodyFatPercentage = navyResult.bodyFatPercentage;

        if (leanMass === null) {
          leanMass = navyResult.leanMass;
          fatMass = navyResult.fatMass;
        }
      }
    }

    const row = await this.measurementsRepository.insert({
      userId,
      measurementDate: input.measurementDate,
      weight: input.weight.toString(),
      triceps: input.triceps?.toString(),
      subscapular: input.subscapular?.toString(),
      chest: input.chest?.toString(),
      midaxillary: input.midaxillary?.toString(),
      suprailiac: input.suprailiac?.toString(),
      abdominal: input.abdominal?.toString(),
      thigh: input.thigh?.toString(),
      neck: input.neck?.toString(),
      shoulders: input.shoulders?.toString(),
      chestCirc: input.chestCirc?.toString(),
      waist: input.waist?.toString(),
      hip: input.hip?.toString(),
      leftThigh: input.leftThigh?.toString(),
      rightThigh: input.rightThigh?.toString(),
      leftCalf: input.leftCalf?.toString(),
      rightCalf: input.rightCalf?.toString(),
      leftBicepRelaxed: input.leftBicepRelaxed?.toString(),
      rightBicepRelaxed: input.rightBicepRelaxed?.toString(),
      leftBicepFlexed: input.leftBicepFlexed?.toString(),
      rightBicepFlexed: input.rightBicepFlexed?.toString(),
      bodyFatPercentage: bodyFatPercentage?.toString(),
      navyBodyFatPercentage: navyBodyFatPercentage?.toString(),
      leanMass: leanMass?.toString(),
      fatMass: fatMass?.toString(),
    });

    return toMeasurementResponse(row, user.sex);
  }

  async findAllByUser(
    userId: string,
    filters: ListMeasurementsInput,
  ): Promise<MeasurementResponse[]> {
    const [rows, user] = await Promise.all([
      this.measurementsRepository.findAllByUser(userId, filters),
      this.measurementsRepository.findUserById(userId),
    ]);
    return rows.map((row) => toMeasurementResponse(row, user?.sex));
  }

  async findOne(id: string, userId: string): Promise<MeasurementResponse> {
    const [measurement, user] = await Promise.all([
      this.measurementsRepository.findById(id, userId),
      this.measurementsRepository.findUserById(userId),
    ]);

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    return toMeasurementResponse(measurement, user?.sex);
  }

  async update(
    id: string,
    userId: string,
    input: UpdateMeasurementInput,
  ): Promise<MeasurementResponse> {
    const existing = await this.measurementsRepository.findById(id, userId);

    if (!existing) {
      throw new NotFoundException('Measurement not found');
    }

    const user = await this.measurementsRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skinfolds = {
      triceps: this.mergeNum(input.triceps, existing.triceps),
      subscapular: this.mergeNum(input.subscapular, existing.subscapular),
      chest: this.mergeNum(input.chest, existing.chest),
      midaxillary: this.mergeNum(input.midaxillary, existing.midaxillary),
      suprailiac: this.mergeNum(input.suprailiac, existing.suprailiac),
      abdominal: this.mergeNum(input.abdominal, existing.abdominal),
      thigh: this.mergeNum(input.thigh, existing.thigh),
    };

    const neckMerged = this.mergeNumOrNull(input.neck, existing.neck);
    const waistMerged = this.mergeNumOrNull(input.waist, existing.waist);
    const hipMerged = this.mergeNumOrNull(input.hip, existing.hip);

    const mergedDate = input.measurementDate ?? existing.measurementDate;
    const mergedWeight = input.weight ?? parseFloat(existing.weight);

    const age = calculateAge(user.birthDate, mergedDate);
    const height = parseFloat(user.height);

    let bodyFatPercentage: number | null = null;
    let navyBodyFatPercentage: number | null = null;
    let leanMass: number | null = null;
    let fatMass: number | null = null;

    if (hasAllSkinfolds(skinfolds)) {
      const pollockResult = calculatePollockBodyFat(skinfolds, age, user.sex, mergedWeight);
      if (pollockResult) {
        bodyFatPercentage = pollockResult.bodyFatPercentage;
        leanMass = pollockResult.leanMass;
        fatMass = pollockResult.fatMass;
      }
    }

    const navyInput = {
      neck: neckMerged ?? undefined,
      waist: waistMerged ?? undefined,
      hip: hipMerged ?? undefined,
      height,
    };

    const canNavy =
      user.sex === 'male'
        ? canCalculateNavyMale(navyInput)
        : canCalculateNavyFemale(navyInput);

    if (canNavy) {
      const navyResult = calculateNavyBodyFat(
        { neck: navyInput.neck!, waist: navyInput.waist!, hip: navyInput.hip, height },
        user.sex,
        mergedWeight,
      );
      if (navyResult) {
        navyBodyFatPercentage = navyResult.bodyFatPercentage;
        if (leanMass === null) {
          leanMass = navyResult.leanMass;
          fatMass = navyResult.fatMass;
        }
      }
    }

    const updateData: MeasurementUpdateData = {
      ...this.toDbValues(input),
      bodyFatPercentage: bodyFatPercentage?.toString() ?? null,
      navyBodyFatPercentage: navyBodyFatPercentage?.toString() ?? null,
      leanMass: leanMass?.toString() ?? null,
      fatMass: fatMass?.toString() ?? null,
      updatedAt: new Date(),
    };

    const row = await this.measurementsRepository.update(id, userId, updateData);
    return toMeasurementResponse(row, user.sex);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.measurementsRepository.delete(id, userId);
  }

  private mergeNum(
    dtoVal: number | undefined,
    dbVal: string | null,
  ): number | undefined {
    return dtoVal !== undefined
      ? dtoVal
      : dbVal !== null
        ? parseFloat(dbVal)
        : undefined;
  }

  private mergeNumOrNull(
    dtoVal: number | null | undefined,
    dbVal: string | null,
  ): number | null {
    return dtoVal !== undefined
      ? dtoVal
      : dbVal !== null
        ? parseFloat(dbVal)
        : null;
  }

  private toDbValues(input: UpdateMeasurementInput): DtoUpdateValues {
    const result: Record<string, string | null | undefined> = {};

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        result[key] =
          value === null
            ? null
            : typeof value === 'number'
              ? value.toString()
              : value;
      }
    }

    return result as DtoUpdateValues;
  }
}
