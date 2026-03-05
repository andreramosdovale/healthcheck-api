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
| POST   | `/auth/logout`   | Revoke refresh token           | No (uses refresh token) | 200    |

### Response shapes

**POST `/auth/register`** and **POST `/auth/login`**:

```typescript
{
  user: {
    id: string;
    email: string;
    nickname: string;
    name: string;
    birthDate: string;
    sex: 'male' | 'female';
    height: string;
    plan: 'free' | 'premium';
    isActive: boolean;
    termsAccepted: boolean;
    termsAcceptedAt: Date;
    createdAt: Date;
    updatedAt: Date | null;
    // passwordHash is NOT included
  }
  accessToken: string;
  refreshToken: string;
}
```

**POST `/auth/refresh`**: same shape as register/login (also returns the user object).

**POST `/auth/logout`**:

```typescript
{
  message: 'Logged out successfully';
}
```

---

## Business Rules

### Registration

- Email must be unique
- Nickname must be unique
- Password must meet complexity requirements (min 8 chars, uppercase, lowercase, number, special char)
- `termsAccepted` must be `true`
- On success: create user, assign default role (`user`), generate tokens

### Login

- Accept email OR nickname as login identifier
- Validate password against stored hash (bcrypt)
- User must be active (`isActive: true`)
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
- Revoke old token + issue new token pair

### Logout

- Mark refresh token as revoked (`revokedAt = now`)
- Access token remains valid until expiration (stateless)

---

## JWT Payload

```typescript
interface JwtPayload {
  sub: string; // user id
  email: string;
  nickname: string;
}
```

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
- Refresh tokens are single-use (revoked after refresh)
- Failed login attempts should not reveal if email/nickname exists
- Passwords hashed with bcrypt (cost factor 12)

---
