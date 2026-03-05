# NestJS Architecture

This project follows a layered architecture.

Each module must separate responsibilities into the following layers:

Controller → Service → Repository

---

## Controller

Responsibilities:

- Handle HTTP requests and route parameters
- Apply guards and permission decorators
- Pass validated DTOs to the service
- Return the service response directly (no transformation)

Controllers must NOT:

- Contain business logic
- Access the database
- Perform manual DTO validation (validation is handled by the global `ValidationPipe`)
- Use `@Res() res: Response` — rely on NestJS automatic response serialization

### Guards and permissions

Every controller must be protected by default:

```ts
@Controller('resource')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourceController {}
```

Each route must declare its required permission:

```ts
@Get()
@Permissions('resource:read')
findAll() { ... }
```

Permission strings follow the format `resource:action`
(e.g. `measurements:create`, `users:read`).

Shared guards live in `src/common/guards/`.
Shared decorators live in `src/common/decorators/`.

---

## Service

Responsibilities:

- Contain all business logic
- Orchestrate operations across repositories
- Throw NestJS HTTP exceptions when domain rules are violated
- Call repositories for all data access

Services must NOT:

- Contain database queries or access the ORM directly
- Handle HTTP concerns (status codes, headers, request/response objects)

### Exception handling

Services are the correct layer for throwing HTTP exceptions:

```ts
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
```

Repositories must not throw HTTP exceptions.

---

## Repository

Responsibilities:

- Encapsulate all database access
- Execute queries using the ORM (Drizzle)
- Return typed domain objects or `null` / empty arrays when nothing is found

Repositories must NOT:

- Contain business logic
- Throw HTTP exceptions
- Handle HTTP logic

---

## Types

Each module must have a `types/` file for shared domain interfaces.

Location: `module-name/types/module-name.types.ts`

Rules:

- Shared interfaces used by the service and repository are declared here
- DTOs must not be reused as domain types
- Database schema types (Drizzle inferred types) are acceptable as domain types when they fully represent the domain object

---

## Cross-cutting concerns

| Concern | Location |
|---|---|
| JWT authentication guard | `src/auth/guards/jwt-auth.guard.ts` |
| Permissions guard | `src/common/guards/permissions.guard.ts` |
| Permissions decorator | `src/common/decorators/permissions.decorator.ts` |
| JWT strategy | `src/auth/strategies/jwt.strategy.ts` |

When adding new cross-cutting behaviour (logging, rate limiting, etc.),
create it in `src/common/` and apply it globally or per-controller via decorators.
