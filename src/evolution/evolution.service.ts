import { Injectable, NotFoundException } from '@nestjs/common';
import { EvolutionRepository } from './evolution.repository';
import type { Measurement } from '@/measurements/types/measurements.types';
import type {
  SummaryPoint,
  CompareResult,
  LatestResult,
} from './types/evolution.types';

@Injectable()
export class EvolutionService {
  constructor(private readonly evolutionRepository: EvolutionRepository) {}

  async getSummary(userId: string, limit = 30): Promise<SummaryPoint[]> {
    return this.evolutionRepository.getSummary(userId, limit);
  }

  async compare(
    userId: string,
    fromId: string,
    toId: string,
  ): Promise<CompareResult> {
    const fromMeasurement = await this.evolutionRepository.findById(fromId);
    const toMeasurement = await this.evolutionRepository.findById(toId);

    if (!fromMeasurement || fromMeasurement.userId !== userId) {
      throw new NotFoundException('From measurement not found');
    }

    if (!toMeasurement || toMeasurement.userId !== userId) {
      throw new NotFoundException('To measurement not found');
    }

    const fromDate = new Date(fromMeasurement.measurementDate);
    const toDate = new Date(toMeasurement.measurementDate);
    const days = Math.round(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const fromWeight = parseFloat(fromMeasurement.weight);
    const toWeight = parseFloat(toMeasurement.weight);

    const fromBf = fromMeasurement.bodyFatPercentage
      ? parseFloat(fromMeasurement.bodyFatPercentage)
      : null;
    const toBf = toMeasurement.bodyFatPercentage
      ? parseFloat(toMeasurement.bodyFatPercentage)
      : null;

    const fromLean = fromMeasurement.leanMass
      ? parseFloat(fromMeasurement.leanMass)
      : null;
    const toLean = toMeasurement.leanMass
      ? parseFloat(toMeasurement.leanMass)
      : null;

    const fromFat = fromMeasurement.fatMass
      ? parseFloat(fromMeasurement.fatMass)
      : null;
    const toFat = toMeasurement.fatMass
      ? parseFloat(toMeasurement.fatMass)
      : null;

    return {
      from: fromMeasurement,
      to: toMeasurement,
      diff: {
        days,
        weight: Math.round((toWeight - fromWeight) * 100) / 100,
        bodyFatPercentage:
          fromBf !== null && toBf !== null
            ? Math.round((toBf - fromBf) * 100) / 100
            : null,
        leanMass:
          fromLean !== null && toLean !== null
            ? Math.round((toLean - fromLean) * 100) / 100
            : null,
        fatMass:
          fromFat !== null && toFat !== null
            ? Math.round((toFat - fromFat) * 100) / 100
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

    const { trend, message } = this.calculateTrend(current, previous);

    return {
      current,
      previous,
      trend,
      message,
    };
  }

  private calculateTrend(
    current: Measurement,
    previous: Measurement | null,
  ): { trend: LatestResult['trend']; message: string } {
    if (!previous) {
      return {
        trend: 'unknown',
        message: 'First measurement recorded. Keep tracking your progress!',
      };
    }

    const currentBf = current.bodyFatPercentage
      ? parseFloat(current.bodyFatPercentage)
      : current.navyBodyFatPercentage
        ? parseFloat(current.navyBodyFatPercentage)
        : null;

    const previousBf = previous.bodyFatPercentage
      ? parseFloat(previous.bodyFatPercentage)
      : previous.navyBodyFatPercentage
        ? parseFloat(previous.navyBodyFatPercentage)
        : null;

    if (currentBf === null || previousBf === null) {
      const weightDiff =
        parseFloat(current.weight) - parseFloat(previous.weight);

      if (weightDiff <= -1) {
        return {
          trend: 'improving',
          message: 'Good job! You are losing weight.',
        };
      } else if (weightDiff >= 1) {
        return {
          trend: 'worsening',
          message: 'Weight increased. Review your routine.',
        };
      } else {
        return { trend: 'stable', message: 'Weight is stable. Keep going!' };
      }
    }

    const bfDiff = currentBf - previousBf;

    if (bfDiff <= -1) {
      if (bfDiff <= -2) {
        return {
          trend: 'improving',
          message: 'Excellent progress! You are on the right track!',
        };
      }
      return { trend: 'improving', message: 'Good job! Keep it up!' };
    } else if (bfDiff >= 1) {
      return {
        trend: 'worsening',
        message: 'Body fat increased. Consider adjusting your routine.',
      };
    } else {
      return {
        trend: 'stable',
        message:
          'You are maintaining your results. Consider adjusting to improve.',
      };
    }
  }
}
