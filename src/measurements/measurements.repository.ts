import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { measurements, users } from '@/database/schema';
import type {
  Measurement,
  MeasurementInsertData,
  MeasurementUpdateData,
  UserForMeasurement,
} from './types/measurements.types';

@Injectable()
export class MeasurementsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findUserById(userId: string): Promise<UserForMeasurement | null> {
    const [user] = await this.db
      .select({
        birthDate: users.birthDate,
        sex: users.sex,
        height: users.height,
      })
      .from(users)
      .where(eq(users.id, userId));

    return user ?? null;
  }

  async findAllByUser(userId: string): Promise<Measurement[]> {
    return this.db
      .select()
      .from(measurements)
      .where(eq(measurements.userId, userId))
      .orderBy(desc(measurements.measurementDate));
  }

  async findById(id: string, userId: string): Promise<Measurement | null> {
    const [measurement] = await this.db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)));

    return measurement ?? null;
  }

  async insert(data: MeasurementInsertData): Promise<Measurement> {
    const [measurement] = await this.db
      .insert(measurements)
      .values(data)
      .returning();

    return measurement;
  }

  async update(
    id: string,
    userId: string,
    data: MeasurementUpdateData,
  ): Promise<Measurement> {
    const [measurement] = await this.db
      .update(measurements)
      .set(data)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))
      .returning();

    return measurement;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)));
  }
}
