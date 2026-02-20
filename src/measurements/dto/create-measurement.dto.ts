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

  @ValidateIf((o) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Subscapular must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  subscapular?: number;

  @ValidateIf((o) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Chest must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  chest?: number;

  @ValidateIf((o) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Midaxillary must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  midaxillary?: number;

  @ValidateIf((o) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Suprailiac must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  suprailiac?: number;

  @ValidateIf((o) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Abdominal must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  abdominal?: number;

  @ValidateIf((o) => o.triceps !== undefined)
  @IsNumber({}, { message: 'Thigh must be a number' })
  @Min(1, { message: 'Minimum skinfold is 1 mm' })
  @Max(100, { message: 'Maximum skinfold is 100 mm' })
  thigh?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Neck must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  neck?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Shoulders must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  shoulders?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Chest circumference must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  chestCirc?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Waist must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  waist?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Hip must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(200, { message: 'Maximum circumference is 200 cm' })
  hip?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Left thigh must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  leftThigh?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Right thigh must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  rightThigh?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Left calf must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  leftCalf?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Right calf must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  rightCalf?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Left bicep relaxed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  leftBicepRelaxed?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Right bicep relaxed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  rightBicepRelaxed?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Left bicep flexed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  leftBicepFlexed?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Right bicep flexed must be a number' })
  @Min(10, { message: 'Minimum circumference is 10 cm' })
  @Max(100, { message: 'Maximum circumference is 100 cm' })
  rightBicepFlexed?: number;
}
