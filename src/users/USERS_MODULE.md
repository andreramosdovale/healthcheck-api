# Users Module

This module manages user accounts and profiles.

---

## Responsibilities

- User CRUD operations
- Profile management
- User lookup for authentication

---

## Endpoints

| Method | Route        | Permission     | Description              |
| ------ | ------------ | -------------- | ------------------------ |
| POST   | `/users`     | `admin:access` | Create user (admin only) |
| GET    | `/users`     | `users:read`   | List all users           |
| GET    | `/users/:id` | `users:read`   | Get user by ID           |
| PUT    | `/users/:id` | `users:update` | Update user              |
| DELETE | `/users/:id` | `users:delete` | Delete user              |

---

## Business Rules

### User Creation

- Email must be unique (case-sensitive comparison via `eq()`)
- Nickname must be unique (case-sensitive comparison via `eq()`)
- Nickname: 3-30 characters, alphanumeric + underscore only
- Password hashed with bcrypt (cost factor 12)
- `termsAccepted` must be `true`
- `termsAcceptedAt` set to current timestamp when terms accepted
- Default plan: `free`
- **Role assignment**: roles are NOT assigned automatically on API creation.
  The seed script assigns the `user` role to seeded accounts. Implementing
  automatic role assignment on registration is a known gap.

### User Update

- Only `name` and `height` can be updated via the standard endpoint (`UpdateUserDto`)
- Email, nickname, password changes require separate flows (not implemented in MVP)
- Returns the updated user without `passwordHash`

### User Deletion

- Soft delete not implemented — user is permanently removed
- Cascades to: `refresh_tokens`, `user_roles`, `measurements`

### Validation Rules

| Field     | Rules                                                           |
| --------- | --------------------------------------------------------------- |
| email     | Valid email format, max 256 chars                               |
| nickname  | 3-30 chars, `^[a-zA-Z0-9_]+$`                                   |
| password  | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |
| name      | 2-100 chars                                                     |
| birthDate | Valid date, age 10-120 years                                    |
| sex       | `male` or `female`                                              |
| height    | 50-300 cm                                                       |

---

## User Lookup Methods

These methods are used internally by AuthModule:

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

Default role assignment on registration: `user`

---

## Dependencies

- `DrizzleModule` — database access
- Used by: `AuthModule`

---
