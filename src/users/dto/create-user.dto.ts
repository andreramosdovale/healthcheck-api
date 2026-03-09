import {
  IsEmail,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'john_doe', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3, { message: 'Nickname must be at least 3 characters' })
  @MaxLength(30, { message: 'Nickname must be at most 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Nickname must contain only letters, numbers and underscore',
  })
  nickname: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain: 1 uppercase, 1 lowercase, 1 number and 1 special character',
  })
  password: string;

  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString({}, { message: 'Invalid birth date' })
  birthDate: string;

  @ApiProperty({ enum: ['male', 'female'] })
  @IsEnum(['male', 'female'], { message: 'Sex must be male or female' })
  sex: 'male' | 'female';

  @ApiProperty({
    example: 175,
    minimum: 50,
    maximum: 300,
    description: 'Height in cm',
  })
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(50, { message: 'Minimum height is 50 cm' })
  @Max(300, { message: 'Maximum height is 300 cm' })
  height: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted: boolean;
}
