# Evolution Module

This module provides progress tracking and comparison features.

---

## Responsibilities

- Aggregate measurement history for charts
- Compare two measurements side by side
- Determine user's progress trend
- Provide motivational feedback

---

## Endpoints

| Method | Route                | Permission          | Description                        |
| ------ | -------------------- | ------------------- | ---------------------------------- |
| GET    | `/evolution/summary` | `measurements:read` | Get measurement history for charts |
| GET    | `/evolution/compare` | `measurements:read` | Compare two measurements           |
| GET    | `/evolution/latest`  | `measurements:read` | Get latest measurement + trend     |

---

## Business Rules

### Summary

Returns time-series data for charting, sorted by date ascending.

**Query Parameters:**

- `limit` (optional, default 30): Maximum number of data points

**Response:**

```typescript
interface SummaryPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null;
  navyBodyFatPercentage: number | null;
  leanMass: number | null;
  fatMass: number | null;
}
```

Use case: Line charts showing weight, body fat %, lean mass over time.

---

### Compare

Compares two specific measurements and calculates the difference.

**Query Parameters:**

- `from` (required): UUID of the earlier measurement
- `to` (required): UUID of the later measurement

**Validation:**

- Both measurements must exist
- Both measurements must belong to the requesting user
- Returns 404 if measurement not found or belongs to another user

**Response:**

```typescript
interface CompareResult {
  from: Measurement;
  to: Measurement;
  diff: {
    days: number; // days between measurements
    weight: number; // weight change (kg)
    bodyFatPercentage: number | null; // body fat % change
    leanMass: number | null; // lean mass change (kg)
    fatMass: number | null; // fat mass change (kg)
  };
}
```

**Interpretation:**

- Negative `weight` diff = weight loss
- Negative `bodyFatPercentage` diff = fat loss (good)
- Positive `leanMass` diff = muscle gain (good)

---

### Latest

Returns the most recent measurement with trend analysis.

**Throws 404** if the user has no measurements at all.

**Response:**

```typescript
interface LatestResult {
  current: Measurement;
  previous: Measurement | null;
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  message: string;
}
```

**Trend Calculation Logic:**

1. If no previous measurement exists (`previous === null`, i.e. only one measurement):
   - trend: `'unknown'`
   - message: `"First measurement recorded. Keep tracking your progress!"`

2. If body fat data is available (Pollock takes priority over Navy):
   - `diff <= -2%`: trend `'improving'`, `"Excellent progress! You are on the right track!"`
   - `diff <= -1%`: trend `'improving'`, `"Good job! Keep it up!"`
   - `diff >= 1%`: trend `'worsening'`, `"Body fat increased. Consider adjusting your routine."`
   - else: trend `'stable'`, `"You are maintaining your results. Consider adjusting to improve."`

3. Fallback to weight comparison (when no body fat data on either measurement):
   - `diff <= -1kg`: trend `'improving'`, `"Good job! You are losing weight."`
   - `diff >= 1kg`: trend `'worsening'`, `"Weight increased. Review your routine."`
   - else: trend `'stable'`, `"Weight is stable. Keep going!"`

> The exact message strings above match the code. Use them verbatim in tests.

---

## Data Ownership

- All endpoints filter by `req.user.id`
- Users can only view their own evolution data
- No cross-user comparisons allowed

---

## Chart Recommendations for Frontend

| Chart Type       | Data Source          | X-Axis     | Y-Axis                      |
| ---------------- | -------------------- | ---------- | --------------------------- |
| Weight Line      | `/evolution/summary` | date       | weight                      |
| Body Fat Line    | `/evolution/summary` | date       | bodyFatPercentage           |
| Body Composition | `/evolution/summary` | date       | leanMass, fatMass (stacked) |
| Before/After     | `/evolution/compare` | from vs to | all metrics                 |

---

## Dependencies

- `DrizzleModule` — database access (queries the `measurements` table directly)

---

## Types

```typescript
// src/evolution/types/evolution.types.ts

export interface SummaryPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null;
  navyBodyFatPercentage: number | null;
  leanMass: number | null;
  fatMass: number | null;
}

export interface CompareResult {
  from: Measurement;
  to: Measurement;
  diff: {
    days: number;
    weight: number;
    bodyFatPercentage: number | null;
    leanMass: number | null;
    fatMass: number | null;
  };
}

export interface LatestResult {
  current: Measurement;
  previous: Measurement | null;
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  message: string;
}
```

---
