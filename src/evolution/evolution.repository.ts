import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc, and, gte, lte, lt } from 'drizzle-orm';
import { DRIZZLE } from '@/database/drizzle.module';
import type { DrizzleDB } from '@/database/db';
import { measurements } from '@/database/schema';
import type { Measurement } from '@/measurements/types/measurements.types';
import type { GetSummaryInput, SummaryPoint } from './types/evolution.types';

@Injectable()
export class EvolutionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getSummary(userId: string, input: GetSummaryInput): Promise<SummaryPoint[]> {
    const conditions = [eq(measurements.userId, userId)];

    if (input.from) {
      conditions.push(gte(measurements.measurementDate, input.from));
    }

    if (input.to) {
      conditions.push(lte(measurements.measurementDate, input.to));
    }

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
      .where(and(...conditions))
      .orderBy(asc(measurements.measurementDate))
      .limit(input.limit);

    return result.map((r) => {
      const hasPollock = r.bodyFatPercentage != null;
      const hasNavy = r.navyBodyFatPercentage != null;

      return {
        date: r.date,
        weight: parseFloat(r.weight),
        bodyFatPercentage: hasPollock
          ? parseFloat(r.bodyFatPercentage!)
          : hasNavy
            ? parseFloat(r.navyBodyFatPercentage!)
            : null,
        bodyFatMethod: (hasPollock ? 'pollock' : hasNavy ? 'navy' : null) as SummaryPoint['bodyFatMethod'],
        leanMass: r.leanMass ? parseFloat(r.leanMass) : null,
        fatMass: r.fatMass ? parseFloat(r.fatMass) : null,
      };
    });
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

  async findPreviousMeasurement(userId: string, beforeDate: string): Promise<Measurement | null> {
    const [result] = await this.db
      .select()
      .from(measurements)
      .where(and(eq(measurements.userId, userId), lt(measurements.measurementDate, beforeDate)))
      .orderBy(desc(measurements.measurementDate))
      .limit(1);

    return result ?? null;
  }
}
