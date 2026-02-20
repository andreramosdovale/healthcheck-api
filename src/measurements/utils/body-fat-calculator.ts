interface SkinfoldData {
  triceps: number;
  subscapular: number;
  chest: number;
  midaxillary: number;
  suprailiac: number;
  abdominal: number;
  thigh: number;
}

interface NavyData {
  neck: number;
  waist: number;
  hip?: number;
  height: number;
}

interface BodyCompositionResult {
  bodyFatPercentage: number;
  leanMass: number;
  fatMass: number;
}

export function calculateAge(
  birthDate: string,
  measurementDate: string,
): number {
  const birth = new Date(birthDate);
  const measurement = new Date(measurementDate);
  let age = measurement.getFullYear() - birth.getFullYear();
  const monthDiff = measurement.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && measurement.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Pollock 7-Fold Formula (Jackson & Pollock)
 * Mais preciso: ±3% de erro
 */
export function calculatePollockBodyFat(
  skinfolds: SkinfoldData,
  age: number,
  sex: 'male' | 'female',
  weight: number,
): BodyCompositionResult | null {
  const sum =
    skinfolds.triceps +
    skinfolds.subscapular +
    skinfolds.chest +
    skinfolds.midaxillary +
    skinfolds.suprailiac +
    skinfolds.abdominal +
    skinfolds.thigh;

  let bodyDensity: number;

  if (sex === 'male') {
    // Jackson & Pollock (1978) - Men
    bodyDensity =
      1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
  } else {
    // Jackson, Pollock & Ward (1980) - Women
    bodyDensity =
      1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
  }

  const bodyFatPercentage = 495 / bodyDensity - 450;

  if (bodyFatPercentage < 2 || bodyFatPercentage > 60) {
    return null;
  }

  const fatMass = (weight * bodyFatPercentage) / 100;
  const leanMass = weight - fatMass;

  return {
    bodyFatPercentage: Math.round(bodyFatPercentage * 100) / 100,
    leanMass: Math.round(leanMass * 100) / 100,
    fatMass: Math.round(fatMass * 100) / 100,
  };
}

/**
 * Navy Method (U.S. Navy)
 * Menos preciso: ±3-5% de erro
 */
export function calculateNavyBodyFat(
  data: NavyData,
  sex: 'male' | 'female',
  weight: number,
): BodyCompositionResult | null {
  let bodyFatPercentage: number;

  if (sex === 'male') {
    // Men: only need neck and waist
    bodyFatPercentage =
      495 /
        (1.0324 -
          0.19077 * Math.log10(data.waist - data.neck) +
          0.15456 * Math.log10(data.height)) -
      450;
  } else {
    // Women: need neck, waist, and hip
    if (!data.hip) {
      return null;
    }
    bodyFatPercentage =
      495 /
        (1.29579 -
          0.35004 * Math.log10(data.waist + data.hip - data.neck) +
          0.221 * Math.log10(data.height)) -
      450;
  }

  if (bodyFatPercentage < 2 || bodyFatPercentage > 60) {
    return null;
  }

  const fatMass = (weight * bodyFatPercentage) / 100;
  const leanMass = weight - fatMass;

  return {
    bodyFatPercentage: Math.round(bodyFatPercentage * 100) / 100,
    leanMass: Math.round(leanMass * 100) / 100,
    fatMass: Math.round(fatMass * 100) / 100,
  };
}

export function hasAllSkinfolds(
  data: Partial<SkinfoldData>,
): data is SkinfoldData {
  return (
    data.triceps !== undefined &&
    data.subscapular !== undefined &&
    data.chest !== undefined &&
    data.midaxillary !== undefined &&
    data.suprailiac !== undefined &&
    data.abdominal !== undefined &&
    data.thigh !== undefined
  );
}

export function canCalculateNavyMale(data: Partial<NavyData>): boolean {
  return (
    data.neck !== undefined &&
    data.waist !== undefined &&
    data.height !== undefined
  );
}

export function canCalculateNavyFemale(data: Partial<NavyData>): boolean {
  return (
    data.neck !== undefined &&
    data.waist !== undefined &&
    data.hip !== undefined &&
    data.height !== undefined
  );
}
