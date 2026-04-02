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
| PATCH  | `/measurements/:id` | `measurements:update` | Partially update measurement |
| DELETE | `/measurements/:id` | `measurements:delete` | Delete measurement       |

---

## Business Rules

### Measurement Creation

- User can only create measurements for themselves (uses `req.user.id`)
- `weight` is required, all other fields are optional
- If **any** skinfold field is provided, **all 7** must be provided — otherwise throws `BadRequestException` with `errorCode: 'SKINFOLDS_INCOMPLETE'`
- Circumferences are independent — any combination is valid
- Body fat is calculated automatically if sufficient data is present
- Fields inside `calculated` are read-only and cannot be set manually — they are always derived from the provided input

### Measurement Update (PATCH)

- Ownership is verified before update — throws 404 if measurement not found or belongs to another user
- All fields are optional — only provided fields overwrite existing values
- Body fat is **recalculated** after update by merging new values with existing ones
- Fields inside `calculated` are always recomputed from the merged state and are ignored if included in the request body

### Measurement List

- Returns measurements for the authenticated user, sorted by `measurementDate` descending (most recent first)
- Supports filtering and pagination via query parameters (see below)

**Query Parameters:**

- `limit` (optional, default 20, max 100): Number of results per page
- `offset` (optional, default 0): Number of results to skip
- `from` (optional): ISO date string (`YYYY-MM-DD`) — filters measurements on or after this date
- `to` (optional): ISO date string (`YYYY-MM-DD`) — filters measurements on or before this date

### Body Fat Calculation Priority

1. **Pollock 7-Fold** (preferred, ±3% accuracy)
   - Requires: all 7 skinfolds + age + sex
   - Formula: Jackson & Pollock (1978) for men, Jackson, Pollock & Ward (1980) for women

2. **Navy Method** (fallback, ±3-5% accuracy)
   - Men: requires neck + waist + height
   - Women: requires neck + waist + hip + height

Calculations are performed automatically on create/update when sufficient data is provided.

### Lean Mass and Fat Mass

`leanMass` and `fatMass` are calculated whenever **any** body fat method produces a result (Pollock or Navy):

```
leanMass = weight × (1 - bodyFatPercentage / 100)
fatMass  = weight × (bodyFatPercentage / 100)
```

`bodyFatPercentage` used here is the resolved value (Pollock > Navy). If neither method has sufficient data, all three fields are `null`.

### Ownership

- Users can only access their own measurements
- All queries filter by `userId`
- Attempting to access another user's measurement returns 404

---

## Skinfold Measurements (7-fold)

All values in millimeters (mm), range 1–100:

| Field       | Description                   |
| ----------- | ----------------------------- |
| triceps     | Back of upper arm             |
| subscapular | Below shoulder blade          |
| chest       | Diagonal fold on chest        |
| midaxillary | Side of torso at armpit level |
| suprailiac  | Above hip bone                |
| abdominal   | Vertical fold beside navel    |
| thigh       | Front of thigh                |

**Rule**: All 7 must be provided together or none at all. Sending a partial set returns:

```json
{
  "message": "All 7 skinfold fields must be provided together or none at all.",
  "errorCode": "SKINFOLDS_INCOMPLETE",
  "missingFields": ["midaxillary", "suprailiac"]
}
```

---

## Circumference Measurements

All values in centimeters (cm), range 10–200:

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

> Most bilateral fields (`leftThigh`, `rightThigh`, `leftCalf`, `rightCalf`, `leftBicepRelaxed`, `rightBicepRelaxed`) are stored for reference only and are not used in calculations. Exception: `leftBicepFlexed` and `rightBicepFlexed` are included in the evolution delta (`GET /evolution/delta/:measurementId`) as indicators of muscle development.

---

## Calculated Fields

Calculated fields are returned inside the `calculated` object in the response. They are **never accepted as input**.

| Field               | Formula                              | When Calculated                                         |
| ------------------- | ------------------------------------ | ------------------------------------------------------- |
| bodyFatPercentage   | Pollock 7-fold (preferred) or Navy   | When sufficient data exists for either method           |
| bodyFatMethod       | `'pollock'` or `'navy'`              | Indicates which method produced `bodyFatPercentage`     |
| leanMass            | `weight × (1 − bodyFatPercentage%)` | When `bodyFatPercentage` is available (either method)   |
| fatMass             | `weight × bodyFatPercentage%`        | When `bodyFatPercentage` is available (either method)   |
| leanMassPercentage  | `100 − bodyFatPercentage`            | When `bodyFatPercentage` is available (either method)   |
| waistHipRatio       | See below                            | When both `waist` and `hip` are present                 |

### Lean Mass Percentage

```
leanMassPercentage = 100 − bodyFatPercentage
```

Returns `null` when `bodyFatPercentage` is `null`.

### Waist-Hip Ratio (WHR)

```
value = waist / hip   (rounded to 2 decimal places)
```

Returns `null` when `waist` or `hip` is absent.

**Risk classification** based on WHO (2008):

| Sex      | `"low"`  | `"moderate"`  | `"high"`  |
| -------- | -------- | ------------- | --------- |
| `male`   | < 0.90   | 0.90 – 0.99   | ≥ 1.00    |
| `female` | < 0.80   | 0.80 – 0.85   | > 0.85    |

- `risk` is `null` when the user's `sex` is not available
- The `risk` field uses semantic codes — UI copy is the frontend's responsibility

**Reference:** WHO (2008). *Waist Circumference and Waist-Hip Ratio: Report of a WHO Expert Consultation*. Geneva, 8–11 December 2008. ISBN 978 92 4 150149 1.

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

## Response Type

```typescript
// src/measurements/types/measurements.types.ts

interface SkinfoldData {
  triceps: number;
  subscapular: number;
  chest: number;
  midaxillary: number;
  suprailiac: number;
  abdominal: number;
  thigh: number;
}

interface CircumferenceData {
  neck: number | null;
  waist: number | null;
  hip: number | null;
  shoulders: number | null;
  chestCirc: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  leftCalf: number | null;
  rightCalf: number | null;
  leftBicepRelaxed: number | null;
  rightBicepRelaxed: number | null;
  leftBicepFlexed: number | null;
  rightBicepFlexed: number | null;
}

interface WaistHipRatio {
  value: number;
  risk: 'low' | 'moderate' | 'high' | null;
}

interface CalculatedData {
  bodyFatPercentage: number | null;
  bodyFatMethod: 'pollock' | 'navy' | null;
  leanMass: number | null;
  fatMass: number | null;
  leanMassPercentage: number | null;
  waistHipRatio: WaistHipRatio | null;
}

export interface Measurement {
  id: string;
  userId: string;
  measurementDate: string;
  weight: number;
  skinfolds: SkinfoldData | null;
  circumferences: CircumferenceData | null;
  calculated: CalculatedData;
  createdAt: string;
  updatedAt: string | null;
}
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
| navy_body_fat_percentage | DECIMAL(5,2) | NULL (calculated, internal use) |
| lean_mass                | DECIMAL(5,2) | NULL (calculated)               |
| fat_mass                 | DECIMAL(5,2) | NULL (calculated)               |
| created_at               | TIMESTAMP    | NOT NULL                        |
| updated_at               | TIMESTAMP    | NULL                            |

> `navy_body_fat_percentage` is stored in the database for recalculation purposes but is not exposed directly in the API response. The resolved value is returned as `calculated.bodyFatPercentage` with `calculated.bodyFatMethod` indicating the source.

---

## Validation Rules

| Field           | Rules                 |
| --------------- | --------------------- |
| measurementDate | Valid ISO date string |
| weight          | 20–500 kg             |
| skinfolds       | 1–100 mm each         |
| circumferences  | 10–200 cm each        |

---

## Field-level Delta

Per-field direction indicators (for detail screen visual feedback) are provided by the
Evolution module, not this module:

```
GET /evolution/delta/:measurementId
```

See `EVOLUTION_MODULE.md` for the full contract.

---

## Dependencies

- `DrizzleModule` — database access
- `UsersModule` (indirect) — user data for calculations (age, sex, height)

---
