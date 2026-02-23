import { measurements } from '../schema';
import type { DrizzleDB } from '../db';
import type { User } from '../schema';

function calcMasses(weight: number, bfPct: number) {
  const fatMass = Math.round(weight * (bfPct / 100) * 100) / 100;
  const leanMass = Math.round((weight - fatMass) * 100) / 100;
  return { fatMass: fatMass.toFixed(2), leanMass: leanMass.toFixed(2) };
}

export async function seedMeasurements(db: DrizzleDB, users: User[]) {
  console.log('Creating measurements...');

  const getUser = (nickname: string) =>
    users.find((u) => u.nickname === nickname)!;

  const adminId = getUser('admin').id;
  const userId = getUser('user_teste').id;
  const professionalId = getUser('profissional').id;

  // admin — male, height 175 cm, 7 monthly measurements (Aug 2025 → Feb 2026)
  const adminMeasurements = [
    { date: '2025-08-15', weight: 85.0, bf: 22.0, triceps: 18, subscapular: 22, chest: 20, suprailiac: 24, abdominal: 28, thigh: 32, waist: '91.00', hip: '97.00', neck: '39.00', leftBicepFlexed: '35.00', rightBicepFlexed: '35.50' },
    { date: '2025-09-15', weight: 84.5, bf: 21.5, triceps: 17, subscapular: 21, chest: 19, suprailiac: 23, abdominal: 27, thigh: 31, waist: '90.00', hip: '96.50', neck: '39.00', leftBicepFlexed: '35.50', rightBicepFlexed: '36.00' },
    { date: '2025-10-15', weight: 83.8, bf: 21.0, triceps: 17, subscapular: 20, chest: 19, suprailiac: 22, abdominal: 26, thigh: 31, waist: '89.00', hip: '96.00', neck: '39.50', leftBicepFlexed: '36.00', rightBicepFlexed: '36.00' },
    { date: '2025-11-15', weight: 83.2, bf: 20.5, triceps: 16, subscapular: 20, chest: 18, suprailiac: 22, abdominal: 25, thigh: 30, waist: '88.50', hip: '95.50', neck: '39.50', leftBicepFlexed: '36.00', rightBicepFlexed: '36.50' },
    { date: '2025-12-15', weight: 82.5, bf: 20.0, triceps: 16, subscapular: 19, chest: 18, suprailiac: 21, abdominal: 24, thigh: 30, waist: '88.00', hip: '95.00', neck: '40.00', leftBicepFlexed: '36.50', rightBicepFlexed: '37.00' },
    { date: '2026-01-15', weight: 82.0, bf: 19.8, triceps: 15, subscapular: 19, chest: 17, suprailiac: 20, abdominal: 24, thigh: 29, waist: '87.50', hip: '94.50', neck: '40.00', leftBicepFlexed: '36.50', rightBicepFlexed: '37.00' },
    { date: '2026-02-15', weight: 81.5, bf: 19.5, triceps: 15, subscapular: 18, chest: 17, suprailiac: 20, abdominal: 23, thigh: 29, waist: '87.00', hip: '94.00', neck: '40.00', leftBicepFlexed: '37.00', rightBicepFlexed: '37.50' },
  ].map((m) => {
    const { fatMass, leanMass } = calcMasses(m.weight, m.bf);
    return {
      userId: adminId,
      measurementDate: m.date,
      weight: m.weight.toFixed(2),
      triceps: m.triceps.toFixed(2),
      subscapular: m.subscapular.toFixed(2),
      chest: m.chest.toFixed(2),
      suprailiac: m.suprailiac.toFixed(2),
      abdominal: m.abdominal.toFixed(2),
      thigh: m.thigh.toFixed(2),
      waist: m.waist,
      hip: m.hip,
      neck: m.neck,
      leftBicepFlexed: m.leftBicepFlexed,
      rightBicepFlexed: m.rightBicepFlexed,
      bodyFatPercentage: m.bf.toFixed(2),
      leanMass,
      fatMass,
    };
  });

  // user_teste — female, height 165 cm, 7 monthly measurements
  const userMeasurements = [
    { date: '2025-08-10', weight: 75.0, bf: 32.0, triceps: 24, subscapular: 20, suprailiac: 22, abdominal: 30, thigh: 28, waist: '78.00', hip: '100.00', neck: '33.00', leftBicepFlexed: '28.00', rightBicepFlexed: '28.00' },
    { date: '2025-09-10', weight: 74.0, bf: 31.5, triceps: 23, subscapular: 19, suprailiac: 21, abdominal: 29, thigh: 28, waist: '77.00', hip: '99.00', neck: '33.00', leftBicepFlexed: '28.00', rightBicepFlexed: '28.50' },
    { date: '2025-10-10', weight: 73.2, bf: 30.8, triceps: 22, subscapular: 19, suprailiac: 21, abdominal: 28, thigh: 27, waist: '76.50', hip: '98.00', neck: '33.50', leftBicepFlexed: '28.50', rightBicepFlexed: '28.50' },
    { date: '2025-11-10', weight: 72.5, bf: 30.0, triceps: 22, subscapular: 18, suprailiac: 20, abdominal: 27, thigh: 27, waist: '76.00', hip: '97.50', neck: '33.50', leftBicepFlexed: '28.50', rightBicepFlexed: '29.00' },
    { date: '2025-12-10', weight: 71.8, bf: 29.5, triceps: 21, subscapular: 18, suprailiac: 19, abdominal: 26, thigh: 26, waist: '75.50', hip: '97.00', neck: '34.00', leftBicepFlexed: '29.00', rightBicepFlexed: '29.00' },
    { date: '2026-01-10', weight: 71.0, bf: 29.0, triceps: 21, subscapular: 17, suprailiac: 19, abdominal: 25, thigh: 26, waist: '75.00', hip: '96.50', neck: '34.00', leftBicepFlexed: '29.00', rightBicepFlexed: '29.50' },
    { date: '2026-02-10', weight: 70.3, bf: 28.5, triceps: 20, subscapular: 17, suprailiac: 18, abdominal: 24, thigh: 25, waist: '74.50', hip: '96.00', neck: '34.00', leftBicepFlexed: '29.50', rightBicepFlexed: '29.50' },
  ].map((m) => {
    const { fatMass, leanMass } = calcMasses(m.weight, m.bf);
    return {
      userId,
      measurementDate: m.date,
      weight: m.weight.toFixed(2),
      triceps: m.triceps.toFixed(2),
      subscapular: m.subscapular.toFixed(2),
      suprailiac: m.suprailiac.toFixed(2),
      abdominal: m.abdominal.toFixed(2),
      thigh: m.thigh.toFixed(2),
      waist: m.waist,
      hip: m.hip,
      neck: m.neck,
      leftBicepFlexed: m.leftBicepFlexed,
      rightBicepFlexed: m.rightBicepFlexed,
      bodyFatPercentage: m.bf.toFixed(2),
      leanMass,
      fatMass,
    };
  });

  // profissional — male, height 180 cm, 7 monthly measurements
  const professionalMeasurements = [
    { date: '2025-08-20', weight: 90.0, bf: 20.0, triceps: 16, subscapular: 19, chest: 18, suprailiac: 22, abdominal: 25, thigh: 30, waist: '90.00', hip: '98.00', neck: '41.00', leftBicepFlexed: '38.00', rightBicepFlexed: '38.50' },
    { date: '2025-09-20', weight: 89.5, bf: 19.8, triceps: 16, subscapular: 18, chest: 18, suprailiac: 21, abdominal: 25, thigh: 30, waist: '89.50', hip: '97.50', neck: '41.00', leftBicepFlexed: '38.00', rightBicepFlexed: '38.50' },
    { date: '2025-10-20', weight: 89.0, bf: 19.5, triceps: 15, subscapular: 18, chest: 17, suprailiac: 21, abdominal: 24, thigh: 29, waist: '89.00', hip: '97.00', neck: '41.50', leftBicepFlexed: '38.50', rightBicepFlexed: '39.00' },
    { date: '2025-11-20', weight: 88.5, bf: 19.2, triceps: 15, subscapular: 18, chest: 17, suprailiac: 20, abdominal: 24, thigh: 29, waist: '88.50', hip: '97.00', neck: '41.50', leftBicepFlexed: '38.50', rightBicepFlexed: '39.00' },
    { date: '2025-12-20', weight: 88.0, bf: 19.0, triceps: 15, subscapular: 17, chest: 17, suprailiac: 20, abdominal: 23, thigh: 28, waist: '88.00', hip: '96.50', neck: '42.00', leftBicepFlexed: '39.00', rightBicepFlexed: '39.50' },
    { date: '2026-01-20', weight: 87.5, bf: 18.8, triceps: 14, subscapular: 17, chest: 16, suprailiac: 19, abdominal: 23, thigh: 28, waist: '87.50', hip: '96.00', neck: '42.00', leftBicepFlexed: '39.00', rightBicepFlexed: '39.50' },
    { date: '2026-02-20', weight: 87.0, bf: 18.5, triceps: 14, subscapular: 17, chest: 16, suprailiac: 19, abdominal: 22, thigh: 28, waist: '87.00', hip: '95.50', neck: '42.00', leftBicepFlexed: '39.50', rightBicepFlexed: '40.00' },
  ].map((m) => {
    const { fatMass, leanMass } = calcMasses(m.weight, m.bf);
    return {
      userId: professionalId,
      measurementDate: m.date,
      weight: m.weight.toFixed(2),
      triceps: m.triceps.toFixed(2),
      subscapular: m.subscapular.toFixed(2),
      chest: m.chest.toFixed(2),
      suprailiac: m.suprailiac.toFixed(2),
      abdominal: m.abdominal.toFixed(2),
      thigh: m.thigh.toFixed(2),
      waist: m.waist,
      hip: m.hip,
      neck: m.neck,
      leftBicepFlexed: m.leftBicepFlexed,
      rightBicepFlexed: m.rightBicepFlexed,
      bodyFatPercentage: m.bf.toFixed(2),
      leanMass,
      fatMass,
    };
  });

  await db
    .insert(measurements)
    .values([
      ...adminMeasurements,
      ...userMeasurements,
      ...professionalMeasurements,
    ])
    .onConflictDoNothing();

  const total =
    adminMeasurements.length +
    userMeasurements.length +
    professionalMeasurements.length;

  console.log(`✅ Measurements: ${total} records (${adminMeasurements.length} per user)`);
}
