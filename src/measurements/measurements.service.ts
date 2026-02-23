import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { measurements, users } from '@/database/schema';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import {
  calculateAge,
  calculatePollockBodyFat,
  calculateNavyBodyFat,
  hasAllSkinfolds,
  canCalculateNavyMale,
  canCalculateNavyFemale,
} from './utils/body-fat-calculator';

@Injectable()
export class MeasurementsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async create(userId: string, createMeasurementDto: CreateMeasurementDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasAnySkinfold =
      createMeasurementDto.triceps !== undefined ||
      createMeasurementDto.subscapular !== undefined ||
      createMeasurementDto.chest !== undefined ||
      createMeasurementDto.midaxillary !== undefined ||
      createMeasurementDto.suprailiac !== undefined ||
      createMeasurementDto.abdominal !== undefined ||
      createMeasurementDto.thigh !== undefined;

    if (hasAnySkinfold && !hasAllSkinfolds(createMeasurementDto)) {
      throw new BadRequestException(
        'All 7 skinfolds are required when providing skinfold measurements',
      );
    }

    const age = calculateAge(
      user.birthDate,
      createMeasurementDto.measurementDate,
    );

    let bodyFatPercentage: number | null = null;
    let navyBodyFatPercentage: number | null = null;
    let leanMass: number | null = null;
    let fatMass: number | null = null;

    if (hasAllSkinfolds(createMeasurementDto)) {
      const pollockResult = calculatePollockBodyFat(
        createMeasurementDto,
        age,
        user.sex,
        createMeasurementDto.weight,
      );

      if (pollockResult) {
        bodyFatPercentage = pollockResult.bodyFatPercentage;
        leanMass = pollockResult.leanMass;
        fatMass = pollockResult.fatMass;
      }
    }

    const height = parseFloat(user.height);
    const navyInput = {
      neck: createMeasurementDto.neck ?? undefined,
      waist: createMeasurementDto.waist ?? undefined,
      hip: createMeasurementDto.hip ?? undefined,
      height,
    };

    const canCalculateNavy =
      user.sex === 'male'
        ? canCalculateNavyMale(navyInput)
        : canCalculateNavyFemale(navyInput);

    if (canCalculateNavy) {
      const navyResult = calculateNavyBodyFat(
        {
          neck: navyInput.neck!,
          waist: navyInput.waist!,
          hip: navyInput.hip,
          height,
        },
        user.sex,
        createMeasurementDto.weight,
      );

      if (navyResult) {
        navyBodyFatPercentage = navyResult.bodyFatPercentage;

        if (leanMass === null) {
          leanMass = navyResult.leanMass;
          fatMass = navyResult.fatMass;
        }
      }
    }

    const [measurement] = await this.db
      .insert(measurements)
      .values({
        userId,
        measurementDate: createMeasurementDto.measurementDate,
        weight: createMeasurementDto.weight.toString(),
        // Skinfolds
        triceps: createMeasurementDto.triceps?.toString(),
        subscapular: createMeasurementDto.subscapular?.toString(),
        chest: createMeasurementDto.chest?.toString(),
        midaxillary: createMeasurementDto.midaxillary?.toString(),
        suprailiac: createMeasurementDto.suprailiac?.toString(),
        abdominal: createMeasurementDto.abdominal?.toString(),
        thigh: createMeasurementDto.thigh?.toString(),
        // Circumferences
        neck: createMeasurementDto.neck?.toString(),
        shoulders: createMeasurementDto.shoulders?.toString(),
        chestCirc: createMeasurementDto.chestCirc?.toString(),
        waist: createMeasurementDto.waist?.toString(),
        hip: createMeasurementDto.hip?.toString(),
        leftThigh: createMeasurementDto.leftThigh?.toString(),
        rightThigh: createMeasurementDto.rightThigh?.toString(),
        leftCalf: createMeasurementDto.leftCalf?.toString(),
        rightCalf: createMeasurementDto.rightCalf?.toString(),
        leftBicepRelaxed: createMeasurementDto.leftBicepRelaxed?.toString(),
        rightBicepRelaxed: createMeasurementDto.rightBicepRelaxed?.toString(),
        leftBicepFlexed: createMeasurementDto.leftBicepFlexed?.toString(),
        rightBicepFlexed: createMeasurementDto.rightBicepFlexed?.toString(),
        // Calculated
        bodyFatPercentage: bodyFatPercentage?.toString(),
        navyBodyFatPercentage: navyBodyFatPercentage?.toString(),
        leanMass: leanMass?.toString(),
        fatMass: fatMass?.toString(),
      })
      .returning();

    return measurement;
  }

  async findAllByUser(userId: string) {
    return this.db
      .select()
      .from(measurements)
      .where(eq(measurements.userId, userId))
      .orderBy(desc(measurements.measurementDate));
  }

  async findOne(id: string, userId: string) {
    const [measurement] = await this.db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)));

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    return measurement;
  }

  async update(
    id: string,
    userId: string,
    updateMeasurementDto: UpdateMeasurementDto,
  ) {
    const existing = await this.findOne(id, userId);

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const skinfolds = {
      triceps: this.mergeNum(updateMeasurementDto.triceps, existing.triceps),
      subscapular: this.mergeNum(
        updateMeasurementDto.subscapular,
        existing.subscapular,
      ),
      chest: this.mergeNum(updateMeasurementDto.chest, existing.chest),
      midaxillary: this.mergeNum(
        updateMeasurementDto.midaxillary,
        existing.midaxillary,
      ),
      suprailiac: this.mergeNum(
        updateMeasurementDto.suprailiac,
        existing.suprailiac,
      ),
      abdominal: this.mergeNum(
        updateMeasurementDto.abdominal,
        existing.abdominal,
      ),
      thigh: this.mergeNum(updateMeasurementDto.thigh, existing.thigh),
    };

    const neckMerged = this.mergeNumOrNull(
      updateMeasurementDto.neck,
      existing.neck,
    );
    const waistMerged = this.mergeNumOrNull(
      updateMeasurementDto.waist,
      existing.waist,
    );
    const hipMerged = this.mergeNumOrNull(
      updateMeasurementDto.hip,
      existing.hip,
    );

    const mergedDate =
      updateMeasurementDto.measurementDate ?? existing.measurementDate;
    const mergedWeight =
      updateMeasurementDto.weight ?? parseFloat(existing.weight);

    const age = calculateAge(user.birthDate, mergedDate);
    const height = parseFloat(user.height);

    let bodyFatPercentage: number | null = null;
    let navyBodyFatPercentage: number | null = null;
    let leanMass: number | null = null;
    let fatMass: number | null = null;

    if (hasAllSkinfolds(skinfolds)) {
      const pollockResult = calculatePollockBodyFat(
        skinfolds,
        age,
        user.sex,
        mergedWeight,
      );
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
        {
          neck: navyInput.neck!,
          waist: navyInput.waist!,
          hip: navyInput.hip,
          height,
        },
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

    const [measurement] = await this.db
      .update(measurements)
      .set({
        ...this.toDbValues(updateMeasurementDto),
        bodyFatPercentage: bodyFatPercentage?.toString() ?? null,
        navyBodyFatPercentage: navyBodyFatPercentage?.toString() ?? null,
        leanMass: leanMass?.toString() ?? null,
        fatMass: fatMass?.toString() ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))
      .returning();

    return measurement;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.db
      .delete(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)));
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

  private toDbValues(dto: Partial<CreateMeasurementDto>) {
    const result: Record<string, string | null | undefined> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        result[key] =
          value === null
            ? null
            : typeof value === 'number'
              ? value.toString()
              : value;
      }
    }

    return result;
  }
}
