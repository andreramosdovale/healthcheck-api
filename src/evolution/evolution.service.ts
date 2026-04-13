import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EvolutionRepository } from './evolution.repository';
import type { Measurement } from '@/measurements/types/measurements.types';
import type {
  GetSummaryInput,
  SummaryPoint,
  CompareResult,
  LatestResult,
  TrendCode,
  DeltaDirection,
  DeltaFields,
  DeltaResult,
} from './types/evolution.types';

@Injectable()
export class EvolutionService {
  constructor(private readonly evolutionRepository: EvolutionRepository) {}

  async getSummary(
    userId: string,
    input: GetSummaryInput,
  ): Promise<SummaryPoint[]> {
    if (
      input.weeks !== undefined &&
      (input.from !== undefined || input.to !== undefined)
    ) {
      throw new BadRequestException(
        'Cannot combine `weeks` with `from` or `to`. Use one or the other.',
      );
    }

    if (input.weeks !== undefined) {
      const from = new Date();
      from.setDate(from.getDate() - input.weeks * 7);
      return this.evolutionRepository.getSummary(userId, {
        limit: input.limit,
        from: from.toISOString().slice(0, 10),
      });
    }

    return this.evolutionRepository.getSummary(userId, input);
  }

  async compare(
    userId: string,
    fromId: string,
    toId: string,
  ): Promise<CompareResult> {
    const a = await this.evolutionRepository.findById(fromId);
    const b = await this.evolutionRepository.findById(toId);

    if (!a || a.userId !== userId) {
      throw new NotFoundException('From measurement not found');
    }

    if (!b || b.userId !== userId) {
      throw new NotFoundException('To measurement not found');
    }

    const [earlier, later] =
      new Date(a.measurementDate) <= new Date(b.measurementDate)
        ? [a, b]
        : [b, a];

    const days = Math.round(
      (new Date(later.measurementDate).getTime() -
        new Date(earlier.measurementDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const earlierBf = this.resolveBodyFat(earlier);
    const laterBf = this.resolveBodyFat(later);

    return {
      from: earlier,
      to: later,
      diff: {
        days,
        weight:
          Math.round(
            (parseFloat(later.weight) - parseFloat(earlier.weight)) * 100,
          ) / 100,
        bodyFatPercentage:
          earlierBf !== null && laterBf !== null
            ? Math.round((laterBf - earlierBf) * 100) / 100
            : null,
        leanMass:
          earlier.leanMass !== null && later.leanMass !== null
            ? Math.round(
                (parseFloat(later.leanMass) - parseFloat(earlier.leanMass)) *
                  100,
              ) / 100
            : null,
        fatMass:
          earlier.fatMass !== null && later.fatMass !== null
            ? Math.round(
                (parseFloat(later.fatMass) - parseFloat(earlier.fatMass)) * 100,
              ) / 100
            : null,
      },
    };
  }

  async getLatest(userId: string): Promise<LatestResult> {
    const result = await this.evolutionRepository.findLatestTwo(userId);

    if (result.length === 0) {
      throw new NotFoundException('No measurements found');
    }

    const current = result[0];
    const previous = result.length > 1 ? result[1] : null;

    const { trend, trendCode } = this.calculateTrend(current, previous);

    return { current, previous, trend, trendCode };
  }

  async getDelta(userId: string, measurementId: string): Promise<DeltaResult> {
    const current = await this.evolutionRepository.findById(measurementId);

    if (!current || current.userId !== userId) {
      throw new NotFoundException('Measurement not found');
    }

    const previous = await this.evolutionRepository.findPreviousMeasurement(
      userId,
      current.measurementDate,
    );

    if (!previous) {
      return {
        measurementId: current.id,
        previousMeasurementId: null,
        delta: null,
      };
    }

    return {
      measurementId: current.id,
      previousMeasurementId: previous.id,
      delta: this.computeDelta(current, previous),
    };
  }

  private rawWhrDirection(
    current: Measurement,
    previous: Measurement,
  ): DeltaDirection {
    const currentRatio =
      current.waist != null && current.hip != null
        ? parseFloat(current.waist) / parseFloat(current.hip)
        : null;
    const previousRatio =
      previous.waist != null && previous.hip != null
        ? parseFloat(previous.waist) / parseFloat(previous.hip)
        : null;
    return this.directionFromNumbers(currentRatio, previousRatio, 0.01);
  }

  private scoreSignal(
    dir: DeltaDirection,
    weight: number,
    higherIsBetter: boolean,
  ): number {
    if (dir === 'up') return higherIsBetter ? weight : -weight;
    if (dir === 'down') return higherIsBetter ? -weight : weight;
    return 0;
  }

  private computeCompositionBalance(
    current: Measurement,
    previous: Measurement,
  ): DeltaDirection {
    const signals = [
      {
        dir: this.direction(current.leanMass, previous.leanMass, 0.2),
        weight: 2,
        higherIsBetter: true,
      },
      {
        dir: this.direction(current.fatMass, previous.fatMass, 0.2),
        weight: 2,
        higherIsBetter: false,
      },
      {
        dir: this.directionFromNumbers(
          this.computeSkinfoldSum(current),
          this.computeSkinfoldSum(previous),
          2.0,
        ),
        weight: 1,
        higherIsBetter: false,
      },
      {
        dir: this.rawWhrDirection(current, previous),
        weight: 1,
        higherIsBetter: false,
      },
    ];

    if (signals.every((s) => s.dir === null)) return null;

    const score = signals.reduce(
      (acc, { dir, weight, higherIsBetter }) =>
        acc + this.scoreSignal(dir, weight, higherIsBetter),
      0,
    );

    if (score > 0) return 'up';
    if (score < 0) return 'down';
    return 'stable';
  }

  private computeDelta(
    current: Measurement,
    previous: Measurement,
  ): DeltaFields {
    return {
      compositionBalance: this.computeCompositionBalance(current, previous),
      weight: this.direction(current.weight, previous.weight, 0.2),
      bodyFatPercentage: this.directionFromNumbers(
        this.resolveBodyFat(current),
        this.resolveBodyFat(previous),
        0.2,
      ),
      leanMass: this.direction(current.leanMass, previous.leanMass, 0.2),
      fatMass: this.direction(current.fatMass, previous.fatMass, 0.2),
      triceps: this.direction(current.triceps, previous.triceps, 1.0),
      subscapular: this.direction(
        current.subscapular,
        previous.subscapular,
        1.0,
      ),
      chest: this.direction(current.chest, previous.chest, 1.0),
      midaxillary: this.direction(
        current.midaxillary,
        previous.midaxillary,
        1.0,
      ),
      suprailiac: this.direction(current.suprailiac, previous.suprailiac, 1.0),
      abdominal: this.direction(current.abdominal, previous.abdominal, 1.0),
      thigh: this.direction(current.thigh, previous.thigh, 1.0),
      skinfoldSum: this.directionFromNumbers(
        this.computeSkinfoldSum(current),
        this.computeSkinfoldSum(previous),
        2.0,
      ),
      neck: this.direction(current.neck, previous.neck, 0.5),
      waist: this.direction(current.waist, previous.waist, 0.5),
      hip: this.direction(current.hip, previous.hip, 0.5),
      shoulders: this.direction(current.shoulders, previous.shoulders, 0.5),
      chestCirc: this.direction(current.chestCirc, previous.chestCirc, 0.5),
      leftThigh: this.direction(current.leftThigh, previous.leftThigh, 0.5),
      rightThigh: this.direction(current.rightThigh, previous.rightThigh, 0.5),
      leftCalf: this.direction(current.leftCalf, previous.leftCalf, 0.5),
      rightCalf: this.direction(current.rightCalf, previous.rightCalf, 0.5),
      leftBicepRelaxed: this.direction(
        current.leftBicepRelaxed,
        previous.leftBicepRelaxed,
        0.5,
      ),
      rightBicepRelaxed: this.direction(
        current.rightBicepRelaxed,
        previous.rightBicepRelaxed,
        0.5,
      ),
      leftBicepFlexed: this.direction(
        current.leftBicepFlexed,
        previous.leftBicepFlexed,
        0.5,
      ),
      rightBicepFlexed: this.direction(
        current.rightBicepFlexed,
        previous.rightBicepFlexed,
        0.5,
      ),
    };
  }

  private direction(
    current: string | null | undefined,
    previous: string | null | undefined,
    threshold: number,
  ): DeltaDirection {
    if (current == null || previous == null) return null;
    return this.directionFromNumbers(
      parseFloat(current),
      parseFloat(previous),
      threshold,
    );
  }

  private directionFromNumbers(
    current: number | null,
    previous: number | null,
    threshold: number,
  ): DeltaDirection {
    if (current === null || previous === null) return null;
    const diff = current - previous;
    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  private computeSkinfoldSum(m: Measurement): number | null {
    const fields = [
      m.triceps,
      m.subscapular,
      m.chest,
      m.midaxillary,
      m.suprailiac,
      m.abdominal,
      m.thigh,
    ];
    if (fields.some((f) => f == null)) return null;
    return fields.reduce((sum, f) => sum + parseFloat(f!), 0);
  }

  private resolveBodyFat(m: Measurement): number | null {
    if (m.bodyFatPercentage != null) return parseFloat(m.bodyFatPercentage);
    if (m.navyBodyFatPercentage != null)
      return parseFloat(m.navyBodyFatPercentage);
    return null;
  }

  private calculateTrend(
    current: Measurement,
    previous: Measurement | null,
  ): { trend: LatestResult['trend']; trendCode: TrendCode } {
    if (!previous) {
      return { trend: null, trendCode: 'first_measurement' };
    }

    const currentBf = this.resolveBodyFat(current);
    const previousBf = this.resolveBodyFat(previous);

    if (currentBf !== null && previousBf !== null) {
      const bfDiff = currentBf - previousBf;

      if (bfDiff <= -2)
        return { trend: 'improving', trendCode: 'excellent_progress' };
      if (bfDiff <= -1)
        return { trend: 'improving', trendCode: 'good_progress' };
      if (bfDiff >= 1)
        return { trend: 'worsening', trendCode: 'fat_increased' };
      return { trend: 'stable', trendCode: 'stable_results' };
    }

    const weightDiff = parseFloat(current.weight) - parseFloat(previous.weight);

    if (weightDiff <= -1)
      return { trend: 'improving', trendCode: 'weight_loss' };
    if (weightDiff >= 1)
      return { trend: 'worsening', trendCode: 'weight_gain' };
    return { trend: 'stable', trendCode: 'weight_stable' };
  }
}
