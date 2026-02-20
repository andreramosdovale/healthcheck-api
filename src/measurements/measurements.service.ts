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
    const canCalculateNavy =
      user.sex === 'male'
        ? canCalculateNavyMale({ ...createMeasurementDto, height })
        : canCalculateNavyFemale({ ...createMeasurementDto, height });

    if (canCalculateNavy) {
      const navyResult = calculateNavyBodyFat(
        {
          neck: createMeasurementDto.neck!,
          waist: createMeasurementDto.waist!,
          hip: createMeasurementDto.hip,
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
    await this.findOne(id, userId);

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    let bodyFatPercentage: number | undefined;
    let navyBodyFatPercentage: number | undefined;
    let leanMass: number | undefined;
    let fatMass: number | undefined;

    if (updateMeasurementDto.weight || updateMeasurementDto.triceps) {
      // TODO: Would need to recalculate - simplified for now, in production, merge with existing data and recalculate
    }

    const [measurement] = await this.db
      .update(measurements)
      .set({
        ...this.toDbValues(updateMeasurementDto),
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

  private toDbValues(dto: Partial<CreateMeasurementDto>) {
    const result: Record<string, string | undefined> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        result[key] = typeof value === 'number' ? value.toString() : value;
      }
    }

    return result;
  }
}
