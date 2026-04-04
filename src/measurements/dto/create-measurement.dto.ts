import {
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import {
  SKINFOLD_LIMITS,
  CIRCUMFERENCE_LIMITS,
} from '../constants/physiological-limits';

export class CreateMeasurementDto {
  @IsDateString({}, { message: 'Invalid measurement date' })
  measurementDate: string;

  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(20, { message: 'Minimum weight is 20 kg' })
  @Max(500, { message: 'Maximum weight is 500 kg' })
  weight: number;

  @IsOptional()
  @IsNumber({}, { message: 'Triceps must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  triceps?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Subscapular must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  subscapular?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Chest must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  chest?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Midaxillary must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  midaxillary?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Suprailiac must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  suprailiac?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Abdominal must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  abdominal?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Thigh must be a number' })
  @Min(SKINFOLD_LIMITS.min, {
    message: `Minimum skinfold is ${SKINFOLD_LIMITS.min} mm`,
  })
  @Max(SKINFOLD_LIMITS.max, {
    message: `Maximum skinfold is ${SKINFOLD_LIMITS.max} mm`,
  })
  thigh?: number;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.neck !== null)
  @IsNumber({}, { message: 'Neck must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.neck.min, {
    message: `Minimum neck circumference is ${CIRCUMFERENCE_LIMITS.neck.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.neck.max, {
    message: `Maximum neck circumference is ${CIRCUMFERENCE_LIMITS.neck.max} cm`,
  })
  neck?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.shoulders !== null)
  @IsNumber({}, { message: 'Shoulders must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.shoulders.min, {
    message: `Minimum shoulders circumference is ${CIRCUMFERENCE_LIMITS.shoulders.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.shoulders.max, {
    message: `Maximum shoulders circumference is ${CIRCUMFERENCE_LIMITS.shoulders.max} cm`,
  })
  shoulders?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.chestCirc !== null)
  @IsNumber({}, { message: 'Chest circumference must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.chestCirc.min, {
    message: `Minimum chest circumference is ${CIRCUMFERENCE_LIMITS.chestCirc.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.chestCirc.max, {
    message: `Maximum chest circumference is ${CIRCUMFERENCE_LIMITS.chestCirc.max} cm`,
  })
  chestCirc?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.waist !== null)
  @IsNumber({}, { message: 'Waist must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.waist.min, {
    message: `Minimum waist circumference is ${CIRCUMFERENCE_LIMITS.waist.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.waist.max, {
    message: `Maximum waist circumference is ${CIRCUMFERENCE_LIMITS.waist.max} cm`,
  })
  waist?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.hip !== null)
  @IsNumber({}, { message: 'Hip must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.hip.min, {
    message: `Minimum hip circumference is ${CIRCUMFERENCE_LIMITS.hip.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.hip.max, {
    message: `Maximum hip circumference is ${CIRCUMFERENCE_LIMITS.hip.max} cm`,
  })
  hip?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftThigh !== null)
  @IsNumber({}, { message: 'Left thigh must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.thigh.min, {
    message: `Minimum thigh circumference is ${CIRCUMFERENCE_LIMITS.thigh.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.thigh.max, {
    message: `Maximum thigh circumference is ${CIRCUMFERENCE_LIMITS.thigh.max} cm`,
  })
  leftThigh?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightThigh !== null)
  @IsNumber({}, { message: 'Right thigh must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.thigh.min, {
    message: `Minimum thigh circumference is ${CIRCUMFERENCE_LIMITS.thigh.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.thigh.max, {
    message: `Maximum thigh circumference is ${CIRCUMFERENCE_LIMITS.thigh.max} cm`,
  })
  rightThigh?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftCalf !== null)
  @IsNumber({}, { message: 'Left calf must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.calf.min, {
    message: `Minimum calf circumference is ${CIRCUMFERENCE_LIMITS.calf.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.calf.max, {
    message: `Maximum calf circumference is ${CIRCUMFERENCE_LIMITS.calf.max} cm`,
  })
  leftCalf?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightCalf !== null)
  @IsNumber({}, { message: 'Right calf must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.calf.min, {
    message: `Minimum calf circumference is ${CIRCUMFERENCE_LIMITS.calf.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.calf.max, {
    message: `Maximum calf circumference is ${CIRCUMFERENCE_LIMITS.calf.max} cm`,
  })
  rightCalf?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftBicepRelaxed !== null)
  @IsNumber({}, { message: 'Left bicep relaxed must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.bicep.min, {
    message: `Minimum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.bicep.max, {
    message: `Maximum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.max} cm`,
  })
  leftBicepRelaxed?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightBicepRelaxed !== null)
  @IsNumber({}, { message: 'Right bicep relaxed must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.bicep.min, {
    message: `Minimum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.bicep.max, {
    message: `Maximum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.max} cm`,
  })
  rightBicepRelaxed?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftBicepFlexed !== null)
  @IsNumber({}, { message: 'Left bicep flexed must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.bicep.min, {
    message: `Minimum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.bicep.max, {
    message: `Maximum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.max} cm`,
  })
  leftBicepFlexed?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightBicepFlexed !== null)
  @IsNumber({}, { message: 'Right bicep flexed must be a number' })
  @Min(CIRCUMFERENCE_LIMITS.bicep.min, {
    message: `Minimum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.min} cm`,
  })
  @Max(CIRCUMFERENCE_LIMITS.bicep.max, {
    message: `Maximum bicep circumference is ${CIRCUMFERENCE_LIMITS.bicep.max} cm`,
  })
  rightBicepFlexed?: number | null;
}
