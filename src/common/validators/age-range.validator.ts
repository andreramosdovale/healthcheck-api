import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'ageRange', async: false })
export class AgeRangeConstraint implements ValidatorConstraintInterface {
  validate(dateString: string, args: ValidationArguments): boolean {
    const [min, max] = args.constraints as [number, number];
    const birth = new Date(dateString);

    if (isNaN(birth.getTime())) {
      return false;
    }

    const now = new Date();
    const hasBirthdayPassedThisYear =
      now >= new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    const age =
      now.getFullYear() -
      birth.getFullYear() -
      (hasBirthdayPassedThisYear ? 0 : 1);

    return age >= min && age <= max;
  }

  defaultMessage(args: ValidationArguments): string {
    const [min, max] = args.constraints as [number, number];
    return `Age must be between ${min} and ${max} years`;
  }
}
