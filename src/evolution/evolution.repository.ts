import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { measurements } from '@/database/schema';
import type { Measurement } from '@/measurements/types/measurements.types';
import type { SummaryPoint } from './types/evolution.types';

@Injectable()
export class EvolutionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getSummary(userId: string, limit: number): Promise<SummaryPoint[]> {
    const result = await this.db
      .select({
        date: measurements.measurementDate,
        weight: measurements.weight,
        bodyFatPercentage: measurements.bodyFatPercentage,
        navyBodyFatPercentage: measurements.navyBodyFatPercentage,
        leanMass: measurements.leanMass,
        fatMass: measurements.fatMass,
      })
      .from(measurements)
      .where(eq(measurements.userId, userId))
      .orderBy(asc(measurements.measurementDate))
      .limit(limit);

    return result.map((r) => ({
      date: r.date,
      weight: parseFloat(r.weight),
      bodyFatPercentage: r.bodyFatPercentage
        ? parseFloat(r.bodyFatPercentage)
        : null,
      navyBodyFatPercentage: r.navyBodyFatPercentage
        ? parseFloat(r.navyBodyFatPercentage)
        : null,
      leanMass: r.leanMass ? parseFloat(r.leanMass) : null,
      fatMass: r.fatMass ? parseFloat(r.fatMass) : null,
    }));
  }

  async findById(id: string): Promise<Measurement | null> {
    const [measurement] = await this.db
      .select()
      .from(measurements)
      .where(eq(measurements.id, id));

    return measurement ?? null;
  }

  async findLatestTwo(userId: string): Promise<Measurement[]> {
    return this.db
      .select()
      .from(measurements)
      .where(eq(measurements.userId, userId))
      .orderBy(desc(measurements.measurementDate))
      .limit(2);
  }
}
