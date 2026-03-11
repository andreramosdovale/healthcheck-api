# Coding Rules

General rules for this project:

- Always use dependency injection
- Avoid using `any`
- Prefer explicit return types on public methods
- Prefer small, focused functions
- Services must not exceed 200 lines
- Functions should ideally stay under 40 lines

---

## Naming conventions

| Artifact | Class name | File name |
|---|---|---|
| Controller | `UserController` | `users.controller.ts` |
| Service | `UserService` | `users.service.ts` |
| Repository | `UserRepository` | `users.repository.ts` |
| Module | `UsersModule` | `users.module.ts` |
| Create DTO | `CreateUserDto` | `create-user.dto.ts` |
| Update DTO | `UpdateUserDto` | `update-user.dto.ts` |
| Types file | — | `users.types.ts` |

Class names use PascalCase. File names always use kebab-case.

---

## DTOs

- DTOs use `class-validator` decorators for all fields (`@IsString()`, `@IsNumber()`, etc.)
- Never perform manual validation inside a controller or service — rely on the global `ValidationPipe`
- Update DTOs extend Create DTOs using `PartialType` from `@nestjs/mapped-types`
- DTOs must not be used as domain types inside services or repositories — use the `types/` file

### Input types pattern

When a service method receives data that originates from a DTO, define a `*Input` interface
in the module's `types/` file. The **controller** maps the DTO to that type before calling
the service. The **service** only knows about `*Input`, never about DTOs.

```ts
// types/users.types.ts
export interface CreateUserInput {
  email: string;
  password: string;
  // ... domain fields, no class-validator decorators
}

// users.controller.ts — maps DTO → Input
create(@Body() dto: CreateUserDto) {
  const input: CreateUserInput = { email: dto.email, ... };
  return this.usersService.create(input);
}

// users.service.ts — receives Input, not DTO
async create(input: CreateUserInput): Promise<SanitizedUser> { ... }
```

Naming: `Create<Entity>Input`, `Update<Entity>Input`.

When the repository needs data shaped differently from the service input (e.g. `password`
becomes `passwordHash`, timestamps are added), define a separate `*Data` interface:
`Create<Entity>Data`, `Update<Entity>Data`. These are repository-level types only.

---

## Imports

- Use the `@/` path alias for all imports outside the current module
- Never import directly from `@/database/` inside a controller or service
  — only repositories may import from `@/database/`

---

## TypeScript

- Avoid `as` type assertions unless there is no safer alternative
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use `readonly` on constructor-injected dependencies

---

## Unit tests

### Location and naming

Unit tests live in `test/unit/`, mirroring the `src/` structure.
Test files use the same name as the source file with `.spec.ts`:

```
src/users/users.service.ts       → test/unit/users/users.service.spec.ts
src/users/users.controller.ts    → test/unit/users/users.controller.spec.ts
```

Run unit tests with:

```
npm run test:unit
npm run test:unit:watch
```

### What to test per layer

**Service** — test all business logic branches:
- Happy path for each method
- Every exception that can be thrown (`NotFoundException`, `BadRequestException`, etc.)
- Edge cases in calculations or conditional logic

**Controller** — test routing and delegation only:
- That each route calls the correct service method with the correct arguments
- That the return value from the service is passed through unchanged
- Do not re-test business logic already covered by the service spec

**Repository** — test query construction when the logic is non-trivial.
Simple CRUD repositories with no conditional logic do not need unit tests.

**Utils / pure functions** — always test. They are the easiest and highest-value tests.

### Mocking pattern

**Controllers** — mock the service with a plain object and override guards:

```ts
const mockService = { create: jest.fn(), findAll: jest.fn() };

await Test.createTestingModule({
  controllers: [ResourceController],
  providers: [{ provide: ResourceService, useValue: mockService }],
})
  .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
  .overrideGuard(PermissionsGuard).useValue({ canActivate: jest.fn(() => true) })
  .compile();
```

**Services** — mock the repository (or the DB token when no repository exists yet):

```ts
const mockRepository = { findById: jest.fn(), create: jest.fn() };

await Test.createTestingModule({
  providers: [
    ResourceService,
    { provide: ResourceRepository, useValue: mockRepository },
  ],
}).compile();
```

### Stubs and fixtures

Shared mock data must not be duplicated across spec files.
Create one stub file per domain entity in `test/stubs/`:

```
test/
  stubs/
    user.stub.ts
    measurement.stub.ts
    auth.stub.ts
```

Stub files export **factory functions**, not plain constants.
A factory function accepts an optional `overrides` parameter so each test can
customize only the fields it cares about:

```ts
// test/stubs/user.stub.ts
import type { User } from '@/users/types/users.types';

export const makeUser = (overrides?: Partial<User>): User => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  nickname: 'test-user',
  passwordHash: 'hashedPassword',
  name: 'Test User',
  birthDate: '1990-01-01',
  sex: 'male',
  height: '175',
  plan: 'free',
  termsAccepted: true,
  termsAcceptedAt: new Date('2024-01-01'),
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  ...overrides,
});
```

Usage in a spec file:

```ts
import { makeUser } from '@test/stubs/user.stub';

const user = makeUser();                              // default
const inactiveUser = makeUser({ isActive: false });   // override only what matters
```

Rules:

- One factory function per entity type (one `make*` per stub file is common, more is fine)
- Factory functions always return a **new object** — never export a shared `const mockUser`
  because tests may mutate the object between runs
- Stub files import domain types from `@/` — never from the DB schema directly
- Use fixed date strings (`new Date('2024-01-01')`) instead of `new Date()` to keep
  snapshots and assertions deterministic
- Add the `@test/` path alias to `jest-unit.json` so stubs can be imported cleanly:

```json
"moduleNameMapper": {
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@test/(.*)$": "<rootDir>/test/$1"
}
```

### General rules

- Call `jest.clearAllMocks()` in `afterEach`
- Use stub factories from `test/stubs/` instead of inlining mock objects in spec files
- Test description format: `it('should <expected behaviour> when <condition>')`
- Never assert on implementation details — assert on return values and thrown exceptions
- Do not use `any` in test files — type mock objects explicitly or use `jest.Mocked<T>`
- Use the `@/` path alias for all imports from `src/` — never use relative `../../../src/` paths
