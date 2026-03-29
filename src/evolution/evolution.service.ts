import { Injectable, NotFoundException } from '@nestjs/common';
import { EvolutionRepository } from './evolution.repository';
import type { Measurement } from '@/measurements/types/measurements.types';
import type {
  GetSummaryInput,
  SummaryPoint,
  CompareResult,
  LatestResult,
  TrendCode,
} from './types/evolution.types';

@Injectable()
export class EvolutionService {
  constructor(private readonly evolutionRepository: EvolutionRepository) {}

  async getSummary(userId: string, input: GetSummaryInput): Promise<SummaryPoint[]> {
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
      new Date(a.measurementDate) <= new Date(b.measurementDate) ? [a, b] : [b, a];

    const days = Math.round(
      (new Date(later.measurementDate).getTime() - new Date(earlier.measurementDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const earlierBf = this.resolveBodyFat(earlier);
    const laterBf = this.resolveBodyFat(later);

    return {
      from: earlier,
      to: later,
      diff: {
        days,
        weight: Math.round((parseFloat(later.weight) - parseFloat(earlier.weight)) * 100) / 100,
        bodyFatPercentage:
          earlierBf !== null && laterBf !== null
            ? Math.round((laterBf - earlierBf) * 100) / 100
            : null,
        leanMass:
          earlier.leanMass !== null && later.leanMass !== null
            ? Math.round((parseFloat(later.leanMass) - parseFloat(earlier.leanMass)) * 100) / 100
            : null,
        fatMass:
          earlier.fatMass !== null && later.fatMass !== null
            ? Math.round((parseFloat(later.fatMass) - parseFloat(earlier.fatMass)) * 100) / 100
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

  private resolveBodyFat(m: Measurement): number | null {
    if (m.bodyFatPercentage != null) return parseFloat(m.bodyFatPercentage);
    if (m.navyBodyFatPercentage != null) return parseFloat(m.navyBodyFatPercentage);
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

      if (bfDiff <= -2) return { trend: 'improving', trendCode: 'excellent_progress' };
      if (bfDiff <= -1) return { trend: 'improving', trendCode: 'good_progress' };
      if (bfDiff >= 1) return { trend: 'worsening', trendCode: 'fat_increased' };
      return { trend: 'stable', trendCode: 'stable_results' };
    }

    const weightDiff = parseFloat(current.weight) - parseFloat(previous.weight);

    if (weightDiff <= -1) return { trend: 'improving', trendCode: 'weight_loss' };
    if (weightDiff >= 1) return { trend: 'worsening', trendCode: 'weight_gain' };
    return { trend: 'stable', trendCode: 'weight_stable' };
  }
}
