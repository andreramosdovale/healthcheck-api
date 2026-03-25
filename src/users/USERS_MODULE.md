# Users Module

This module manages user accounts and profiles.

---

## Responsibilities

- User CRUD operations
- Profile management
- User lookup for authentication

---

## Endpoints

| Method | Route        | Permission      | Description                        |
| ------ | ------------ | --------------- | ---------------------------------- |
| POST   | `/users`     | `admin:manage`  | Create user (admin only)           |
| GET    | `/users`     | `admin:manage`  | List all users (paginated)         |
| GET    | `/users/me`  | authenticated   | Get own profile                    |
| PATCH  | `/users/me`  | authenticated   | Update own profile (name, height)  |
| GET    | `/users/:id` | `users:read`    | Get user by ID                     |
| PATCH  | `/users/:id` | `users:update`  | Update user (admin)                |
| DELETE | `/users/:id` | `users:delete`  | Delete user (irreversible)         |

> `authenticated` means any valid JWT — protected by `JwtAuthGuard` only, no `PermissionsGuard`.

---

## Business Rules

### User Creation

- Only admins can create users via `POST /users` (requires `admin:manage`)
- Regular user registration is handled by `AuthModule` (`POST /auth/register`)
- Email must be unique — comparison is **case-sensitive** (see warning below)
- Nickname must be unique — comparison is **case-sensitive**
- Nickname: 3–30 characters, alphanumeric + underscore only (`^[a-zA-Z0-9_]+$`)
- Password hashed with bcrypt (cost factor 12)
- `termsAccepted` must be `true`
- `termsAcceptedAt` set to current timestamp when terms accepted
- Default plan: `free`
- Default role: `user` — assigned automatically on creation (both via API and registration)

> ⚠️ **Email case-sensitivity**: email comparison uses an exact match (`eq()`). `user@example.com`
> and `User@example.com` are treated as different addresses. Clients must normalize email to
> lowercase before sending to avoid duplicate accounts and login mismatches.

### User Update (PATCH)

- `/users/me` — authenticated user updates their own `name` and/or `height`
- `/users/:id` — admin updates any user's `name` and/or `height`
- Only provided fields are overwritten — omitted fields retain their current values
- Email, nickname, and password changes require separate flows (not yet implemented)
- Returns the updated user without `passwordHash`

### User List

- Returns all users sorted by `createdAt` descending
- Admin-only (`admin:manage`)

**Query Parameters:**

- `limit` (optional, default 20, max 100): Number of results per page
- `offset` (optional, default 0): Number of results to skip
- `search` (optional): Filters by name, email, or nickname (partial match)

### User Deletion

> ⚠️ **Irreversible**: deletion is permanent. There is no soft delete or recovery mechanism.
> Deleting a user cascades to and permanently removes: `refresh_tokens`, `user_roles`, `measurements`.
> All measurement history for the user is lost.

- Admin-only (`users:delete`)
- Returns 404 if user not found

### Validation Rules

| Field     | Rules                                                           |
| --------- | --------------------------------------------------------------- |
| email     | Valid email format, max 256 chars                               |
| nickname  | 3–30 chars, `^[a-zA-Z0-9_]+$`                                  |
| password  | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |
| name      | 2–100 chars                                                     |
| birthDate | Valid date, age 10–120 years                                    |
| sex       | `male` or `female`                                              |
| height    | 50–300 cm                                                       |

---

## User Lookup Methods

These methods are used internally by `AuthModule`:

| Method                         | Purpose           |
| ------------------------------ | ----------------- |
| `findByEmail(email)`           | Login by email    |
| `findByNickname(nickname)`     | Login by nickname |
| `findByEmailOrNickname(login)` | Login with either |

These methods return the full user object including `passwordHash` for auth validation.

---

## Response Sanitization

Public responses must NOT include `passwordHash`.
The service has a `sanitizeUser()` method that strips sensitive fields.

---

## Database Table: `users`

| Column            | Type                    | Constraints              |
| ----------------- | ----------------------- | ------------------------ |
| id                | UUID                    | PK, auto-generated       |
| email             | VARCHAR(256)            | NOT NULL, UNIQUE         |
| nickname          | VARCHAR(30)             | NOT NULL, UNIQUE         |
| password_hash     | TEXT                    | NOT NULL                 |
| name              | VARCHAR(100)            | NOT NULL                 |
| birth_date        | DATE                    | NOT NULL                 |
| sex               | ENUM('male', 'female')  | NOT NULL                 |
| height            | DECIMAL(5,2)            | NOT NULL                 |
| plan              | ENUM('free', 'premium') | NOT NULL, DEFAULT 'free' |
| is_active         | BOOLEAN                 | NOT NULL, DEFAULT true   |
| terms_accepted    | BOOLEAN                 | NOT NULL, DEFAULT false  |
| terms_accepted_at | TIMESTAMP               | NULL                     |
| created_at        | TIMESTAMP               | NOT NULL, DEFAULT now()  |
| updated_at        | TIMESTAMP               | NULL                     |

---

## RBAC Integration

Users are assigned roles via the `user_roles` junction table.
Permissions are checked via `PermissionsGuard` using the user's roles.

The `user` role is assigned automatically on account creation (both via `POST /users` and `POST /auth/register`).

---

## Dependencies

- `DrizzleModule` — database access
- Used by: `AuthModule`

---
