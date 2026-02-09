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

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Nickname must be at least 3 characters' })
  @MaxLength(30, { message: 'Nickname must be at most 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Nickname must contain only letters, numbers and underscore',
  })
  nickname: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain: 1 uppercase, 1 lowercase, 1 number and 1 special character',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  @IsDateString({}, { message: 'Invalid birth date' })
  birthDate: string;

  @IsEnum(['male', 'female'], { message: 'Sex must be male or female' })
  sex: 'male' | 'female';

  @IsNumber({}, { message: 'Height must be a number' })
  @Min(50, { message: 'Minimum height is 50 cm' })
  @Max(300, { message: 'Maximum height is 300 cm' })
  height: number;

  @IsBoolean()
  termsAccepted: boolean;
}
