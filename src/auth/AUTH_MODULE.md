# Auth Module

This module handles authentication and authorization.

---

## Responsibilities

- User registration (creates user + issues tokens)
- User login (validates credentials + issues tokens)
- Token refresh (rotates access and refresh tokens)
- Logout (revokes refresh token)

---

## Endpoints

| Method | Route            | Description                    | Auth Required           | Status |
| ------ | ---------------- | ------------------------------ | ----------------------- | ------ |
| POST   | `/auth/register` | Create account + return tokens | No                      | 201    |
| POST   | `/auth/login`    | Authenticate + return tokens   | No                      | 200    |
| POST   | `/auth/refresh`  | Rotate tokens                  | No (uses refresh token) | 200    |
| POST   | `/auth/logout`   | Revoke refresh token           | No (uses refresh token) | 204    |

> Protected endpoints (outside this module) require: `Authorization: Bearer <accessToken>`

---

### Request shapes

**POST `/auth/refresh`** and **POST `/auth/logout`**:

```typescript
{
  refreshToken: string;
}
```

---

### Response shapes

**POST `/auth/register`** and **POST `/auth/login`**:

```typescript
{
  user: {
    id: string;
    email: string;
    nickname: string;
    name: string;
    birthDate: string;       // ISO 8601 date string
    sex: 'male' | 'female';
    height: number;          // cm
    plan: 'free' | 'premium';
    isActive: boolean;
    termsAccepted: boolean;
    termsAcceptedAt: string; // ISO 8601 datetime string
    createdAt: string;       // ISO 8601 datetime string
    updatedAt: string | null;
    // passwordHash is NOT included
  };
  accessToken: string;
  refreshToken: string;
}
```

**POST `/auth/refresh`**: returns tokens only — user data is not included.

```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

> To get updated user data after a refresh, call `GET /users/me`.

**POST `/auth/logout`**: `204 No Content` — no response body.

---

### Error responses

**POST `/auth/register`**:

| Status | Condition                            |
| ------ | ------------------------------------ |
| 400    | Validation failure (invalid fields)  |
| 409    | Email or nickname already in use     |

**POST `/auth/login`**:

| Status | Condition                                         |
| ------ | ------------------------------------------------- |
| 400    | Validation failure (missing fields)               |
| 401    | Invalid credentials (wrong password)              |
| 403    | Account inactive (`isActive: false`)              |

> Login errors for invalid credentials must not reveal whether the email/nickname exists.

**POST `/auth/refresh`**:

| Status | Condition                                  |
| ------ | ------------------------------------------ |
| 401    | Token not found, expired, or already revoked |

**POST `/auth/logout`**:

| Status | Condition              |
| ------ | ---------------------- |
| 401    | Token not found or invalid |

---

## Business Rules

### Registration

- Email must be unique
- Nickname must be unique
- Password must meet complexity requirements (min 8 chars, uppercase, lowercase, number, special char)
- `termsAccepted` must be `true`
- On success: create user, assign default role (`user`), generate token pair

### Login

- Accept email OR nickname as login identifier
- Validate password against stored hash (bcrypt)
- User must be active (`isActive: true`) — inactive accounts return `403`
- On success: generate access token + refresh token

### Token Strategy

| Token         | Duration   | Storage                           |
| ------------- | ---------- | --------------------------------- |
| Access Token  | 15 minutes | JWT (stateless)                   |
| Refresh Token | 7 days     | Database (`refresh_tokens` table) |

### Refresh

- Validate refresh token exists in database
- Check token is not expired
- Check token is not revoked (`revokedAt` is null)
- Revoke old token + issue new token pair (rotation)

### Logout

- Mark refresh token as revoked (`revokedAt = now`)
- Access token remains valid until natural expiration (stateless — cannot be invalidated early)

---

## JWT Payload

```typescript
interface JwtPayload {
  sub: string;      // user id
  email: string;
  nickname: string;
  roles: string[];  // e.g. ['user'], ['admin', 'user']
}
```

Roles are embedded in the JWT payload so that `PermissionsGuard` can validate permissions
on every request without an additional database query.

---

## RBAC — Roles and Permissions

### Roles

| Role    | Assigned by                          |
| ------- | ------------------------------------ |
| `user`  | Automatically on registration or user creation |
| `admin` | Manually via seed or database        |

### Permission matrix

| Permission             | `user` | `admin` | How enforced              |
| ---------------------- | ------ | ------- | ------------------------- |
| `measurements:create`  | ✓      | ✓       | `PermissionsGuard`        |
| `measurements:read`    | ✓      | ✓       | `PermissionsGuard`        |
| `measurements:update`  | ✓      | ✓       | `PermissionsGuard`        |
| `measurements:delete`  | ✓      | ✓       | `PermissionsGuard`        |
| `users:read`           | —      | ✓       | `PermissionsGuard`        |
| `users:update`         | —      | ✓       | `PermissionsGuard`        |
| `users:delete`         | —      | ✓       | `PermissionsGuard`        |
| `admin:manage`         | —      | ✓       | `PermissionsGuard`        |
| _(authenticated only)_ | ✓      | ✓       | `JwtAuthGuard` only — no `PermissionsGuard` |

> `authenticated` is not a permission — it means any valid JWT is accepted.
> Endpoints marked `authenticated` are protected by `JwtAuthGuard` but bypass `PermissionsGuard`.
> All other endpoints go through both guards.

### Permission naming convention

All permissions follow the `resource:action` pattern.
`admin:manage` is the permission that gates purely administrative operations
(creating users via API, listing all users).

---

## Dependencies

- `UsersModule` — uses `UsersService` to create and find users
- `@nestjs/jwt` — JWT signing and verification
- `@nestjs/passport` — Passport integration
- `bcrypt` — password hashing

---

## Database Tables

- `users` — user accounts (via UsersModule)
- `refresh_tokens` — stores refresh tokens with expiration and revocation status

---

## Environment Variables

| Variable                 | Description                 | Example                        |
| ------------------------ | --------------------------- | ------------------------------ |
| `JWT_SECRET`             | Secret key for signing JWTs | `your-secret-key-min-32-chars` |
| `JWT_EXPIRES_IN`         | Access token TTL            | `15m`                          |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL           | `7d`                           |

---

## Security Considerations

- Never log tokens or passwords
- Refresh tokens are single-use (revoked immediately after rotation)
- Failed login must not reveal whether email/nickname exists — always return generic `401`
- Passwords hashed with bcrypt (cost factor 12)
- Access tokens cannot be invalidated before expiration — keep TTL short (15 minutes)
- Rate limiting should be applied to `/auth/login` and `/auth/register` to prevent brute-force attacks

---
