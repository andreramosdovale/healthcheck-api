import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(50, { message: 'Minimum height is 50 cm' })
  @Max(300, { message: 'Maximum height is 300 cm' })
  height?: number;
}
