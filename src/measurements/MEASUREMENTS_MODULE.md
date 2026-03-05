# Measurements Module

This module handles body composition measurements and calculations.

---

## Responsibilities

- Record body measurements (weight, skinfolds, circumferences)
- Calculate body fat percentage (Pollock 7-fold and Navy methods)
- Calculate lean mass and fat mass
- Measurement history per user

---

## Endpoints

| Method | Route               | Permission            | Description              |
| ------ | ------------------- | --------------------- | ------------------------ |
| POST   | `/measurements`     | `measurements:create` | Create measurement       |
| GET    | `/measurements`     | `measurements:read`   | List user's measurements |
| GET    | `/measurements/:id` | `measurements:read`   | Get measurement by ID    |
| PUT    | `/measurements/:id` | `measurements:update` | Update measurement       |
| DELETE | `/measurements/:id` | `measurements:delete` | Delete measurement       |

---

## Business Rules

### Measurement Creation

- User can only create measurements for themselves (uses `req.user.id`)
- `weight` is required, all other fields are optional
- If **any** skin-fold field is provided, **all 7** must be provided — otherwise throws `BadRequestException`
- Circumferences are independent — any combination is valid
- Body fat is calculated automatically if sufficient data is present

### Measurement Update

- Ownership is verified before update — throws 404 if measurement not found or belongs to another user
- All fields are optional — only provided fields overwrite existing values
- Body fat is **recalculated** after update by merging new values with existing ones
- Calculated fields (`bodyFatPercentage`, `navyBodyFatPercentage`, `leanMass`, `fatMass`)
  are always recomputed from the merged state and cannot be set manually

### Measurement List

- Returns all measurements for the authenticated user
- Sorted by `measurementDate` descending (most recent first)

### Body Fat Calculation Priority

1. **Pollock 7-Fold** (preferred, ±3% accuracy)
   - Requires: all 7 skinfolds + age + sex
   - Formula: Jackson & Pollock (1978) for men, Jackson, Pollock & Ward (1980) for women

2. **Navy Method** (fallback, ±3-5% accuracy)
   - Men: requires neck + waist + height
   - Women: requires neck + waist + hip + height

Calculations are performed automatically on create/update when sufficient data is provided.

### Ownership

- Users can only access their own measurements
- All queries filter by `userId`
- Attempting to access another user's measurement returns 404

---

## Skinfold Measurements (7-fold)

All values in millimeters (mm), range 1-100:

| Field       | Description                   |
| ----------- | ----------------------------- |
| triceps     | Back of upper arm             |
| subscapular | Below shoulder blade          |
| chest       | Diagonal fold on chest        |
| midaxillary | Side of torso at armpit level |
| suprailiac  | Above hip bone                |
| abdominal   | Vertical fold beside navel    |
| thigh       | Front of thigh                |

**Rule**: If one skinfold is provided, all 7 must be provided.

---

## Circumference Measurements

All values in centimeters (cm), range 10-200:

| Field                                | Description      | Required for Navy |
| ------------------------------------ | ---------------- | ----------------- |
| neck                                 | Around neck      | Yes (both)        |
| waist                                | At navel level   | Yes (both)        |
| hip                                  | Widest point     | Yes (women only)  |
| shoulders                            | Around shoulders | No                |
| chestCirc                            | Around chest     | No                |
| leftThigh / rightThigh               | Mid-thigh        | No                |
| leftCalf / rightCalf                 | Widest calf      | No                |
| leftBicepRelaxed / rightBicepRelaxed | Arm relaxed      | No                |
| leftBicepFlexed / rightBicepFlexed   | Arm flexed       | No                |

---

## Calculated Fields

| Field                 | Formula                 | When Calculated                              |
| --------------------- | ----------------------- | -------------------------------------------- |
| bodyFatPercentage     | Pollock 7-fold          | When all 7 skinfolds provided                |
| navyBodyFatPercentage | Navy method             | When neck + waist (+ hip for women) provided |
| leanMass              | weight × (1 - bodyFat%) | When body fat calculated                     |
| fatMass               | weight × bodyFat%       | When body fat calculated                     |

---

## Pollock 7-Fold Formula

### Men (Jackson & Pollock 1978)

```
bodyDensity = 1.112 - 0.00043499(sum) + 0.00000055(sum²) - 0.00028826(age)
bodyFat% = (495 / bodyDensity) - 450
```

### Women (Jackson, Pollock & Ward 1980)

```
bodyDensity = 1.097 - 0.00046971(sum) + 0.00000056(sum²) - 0.00012828(age)
bodyFat% = (495 / bodyDensity) - 450
```

Where `sum` = all 7 skinfolds added together.

---

## Navy Method Formula

### Men

```
bodyFat% = 495 / (1.0324 - 0.19077 × log10(waist - neck) + 0.15456 × log10(height)) - 450
```

### Women

```
bodyFat% = 495 / (1.29579 - 0.35004 × log10(waist + hip - neck) + 0.221 × log10(height)) - 450
```

---

## Database Table: `measurements`

| Column                   | Type         | Constraints                     |
| ------------------------ | ------------ | ------------------------------- |
| id                       | UUID         | PK, auto-generated              |
| user_id                  | UUID         | FK → users.id, NOT NULL         |
| measurement_date         | DATE         | NOT NULL                        |
| weight                   | DECIMAL(5,2) | NOT NULL                        |
| triceps...thigh          | DECIMAL(5,2) | NULL (7 skinfold columns)       |
| neck...rightBicepFlexed  | DECIMAL(5,2) | NULL (13 circumference columns) |
| body_fat_percentage      | DECIMAL(5,2) | NULL (calculated)               |
| navy_body_fat_percentage | DECIMAL(5,2) | NULL (calculated)               |
| lean_mass                | DECIMAL(5,2) | NULL (calculated)               |
| fat_mass                 | DECIMAL(5,2) | NULL (calculated)               |
| created_at               | TIMESTAMP    | NOT NULL                        |
| updated_at               | TIMESTAMP    | NULL                            |

---

## Validation Rules

| Field           | Rules                 |
| --------------- | --------------------- |
| measurementDate | Valid ISO date string |
| weight          | 20-500 kg             |
| skinfolds       | 1-100 mm each         |
| circumferences  | 10-200 cm each        |

---

## Dependencies

- `DrizzleModule` — database access
- `UsersModule` (indirect) — user data for calculations (age, sex, height)

---
