# Evolution Module

This module provides progress tracking and comparison features.

---

## Responsibilities

- Aggregate measurement history for charts
- Compare two measurements side by side
- Determine user's progress trend
- Return a semantic trend code for frontend i18n/UI mapping

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
- `from` (optional): ISO date string (`YYYY-MM-DD`) — filters measurements on or after this date
- `to` (optional): ISO date string (`YYYY-MM-DD`) — filters measurements on or before this date

**Response:**

```typescript
interface SummaryPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null; // resolved internally: Pollock > Navy
  bodyFatMethod: 'pollock' | 'navy' | null; // which method produced the value above
  leanMass: number | null;
  fatMass: number | null;
}
```

**Body fat resolution rule:** when a measurement has both Pollock and Navy values, `bodyFatPercentage` exposes the Pollock value and `bodyFatMethod` is `'pollock'`. When only Navy is available, `bodyFatMethod` is `'navy'`. When neither is available, both fields are `null`. The raw `navyBodyFatPercentage` field is never exposed in the summary — resolution happens server-side.

Use case: Line charts showing weight, body fat %, lean mass over time.

---

### Compare

Compares two specific measurements and calculates the difference.

**Query Parameters:**

- `from` (required): UUID of one measurement
- `to` (required): UUID of the other measurement

**Order contract:** `from` and `to` can be passed in any order. The API normalises them internally — `from` is always set to the measurement with the earlier date, `to` to the later one. The `diff` always represents `to − from`.

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
    days: number;               // days between measurements (always positive)
    weight: number;             // weight change (kg): to − from
    bodyFatPercentage: number | null; // body fat % change: to − from
    leanMass: number | null;    // lean mass change (kg): to − from
    fatMass: number | null;     // fat mass change (kg): to − from
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
  trend: 'improving' | 'stable' | 'worsening' | null; // null = only one measurement exists
  trendCode: TrendCode | null; // null when trend is null
}

type TrendCode =
  | 'first_measurement'
  | 'excellent_progress'    // body fat diff <= -2%
  | 'good_progress'         // body fat diff <= -1%
  | 'fat_increased'         // body fat diff >= +1%
  | 'stable_results'        // body fat diff within -1%..+1%
  | 'weight_loss'           // weight diff <= -1kg (fallback)
  | 'weight_gain'           // weight diff >= +1kg (fallback)
  | 'weight_stable';        // weight diff within -1kg..+1kg (fallback)
```

**`trendCode` is the canonical field for frontend messages.** Never rely on hard-coded strings from the API — map `trendCode` to the appropriate copy/translation in the UI layer.

**Trend Calculation Logic:**

1. If no previous measurement exists (`previous === null`, i.e. only one measurement):
   - `trend`: `null`
   - `trendCode`: `'first_measurement'`

2. If body fat data is available on both measurements (Pollock takes priority over Navy):
   - `diff <= -2%`: `trend: 'improving'`, `trendCode: 'excellent_progress'`
   - `diff <= -1%`: `trend: 'improving'`, `trendCode: 'good_progress'`
   - `diff >= +1%`: `trend: 'worsening'`, `trendCode: 'fat_increased'`
   - else: `trend: 'stable'`, `trendCode: 'stable_results'`

3. Fallback to weight comparison (when no body fat data on either measurement):
   - `diff <= -1kg`: `trend: 'improving'`, `trendCode: 'weight_loss'`
   - `diff >= +1kg`: `trend: 'worsening'`, `trendCode: 'weight_gain'`
   - else: `trend: 'stable'`, `trendCode: 'weight_stable'`

> Use `trendCode` values verbatim in tests — they are the stable contract, not UI strings.

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

export type TrendCode =
  | 'first_measurement'
  | 'excellent_progress'
  | 'good_progress'
  | 'fat_increased'
  | 'stable_results'
  | 'weight_loss'
  | 'weight_gain'
  | 'weight_stable';

export interface SummaryPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null;
  bodyFatMethod: 'pollock' | 'navy' | null;
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
  trend: 'improving' | 'stable' | 'worsening' | null;
  trendCode: TrendCode | null;
}
```

---
