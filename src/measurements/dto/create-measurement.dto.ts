import {
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class CreateMeasurementDto {
  @IsDateString({}, { message: 'Invalid measurement date' })
  measurementDate: string;

  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(20, { message: 'Minimum weight is 20 kg' })
  @Max(500, { message: 'Maximum weight is 500 kg' })
  weight: number;

  @IsOptional()
  @IsNumber({}, { message: 'Triceps must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  triceps?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Subscapular must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  subscapular?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Chest must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  chest?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Midaxillary must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  midaxillary?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Suprailiac must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  suprailiac?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Abdominal must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  abdominal?: number;

  @ValidateIf((o: CreateMeasurementDto) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Thigh must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  thigh?: number;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.neck !== null)
  @IsNumber({}, { message: 'Neck must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  neck?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.shoulders !== null)
  @IsNumber({}, { message: 'Shoulders must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  shoulders?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.chestCirc !== null)
  @IsNumber({}, { message: 'Chest circumference must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  chestCirc?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.waist !== null)
  @IsNumber({}, { message: 'Waist must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  waist?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.hip !== null)
  @IsNumber({}, { message: 'Hip must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  hip?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftThigh !== null)
  @IsNumber({}, { message: 'Left thigh must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  leftThigh?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightThigh !== null)
  @IsNumber({}, { message: 'Right thigh must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  rightThigh?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftCalf !== null)
  @IsNumber({}, { message: 'Left calf must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  leftCalf?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightCalf !== null)
  @IsNumber({}, { message: 'Right calf must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  rightCalf?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftBicepRelaxed !== null)
  @IsNumber({}, { message: 'Left bicep relaxed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  leftBicepRelaxed?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightBicepRelaxed !== null)
  @IsNumber({}, { message: 'Right bicep relaxed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  rightBicepRelaxed?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.leftBicepFlexed !== null)
  @IsNumber({}, { message: 'Left bicep flexed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  leftBicepFlexed?: number | null;

  @IsOptional()
  @ValidateIf((o: CreateMeasurementDto) => o.rightBicepFlexed !== null)
  @IsNumber({}, { message: 'Right bicep flexed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  rightBicepFlexed?: number | null;
}
