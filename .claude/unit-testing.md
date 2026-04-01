# Unit Testing Guide

This guide documents the unit testing conventions used in this project.
All rules here reflect patterns already in use — when in doubt, look at an existing spec file.

---

## Structure

```
test/
  jest-unit.json
  stubs/
    user.stub.ts
    measurement.stub.ts
  unit/
    auth/
      auth.controller.spec.ts
      auth.service.spec.ts
    common/
      decorators/
        permissions.decorator.spec.ts
      guards/
        permissions.guard.spec.ts
    evolution/
      evolution.controller.spec.ts
      evolution.service.spec.ts
    measurements/
      measurements.controller.spec.ts
      measurements.service.spec.ts
      utils/
        body-fat-calculator.spec.ts
    users/
      users.controller.spec.ts
      users.service.spec.ts
```

Mirror `src/` exactly. A file at `src/foo/bar.service.ts` gets its test at
`test/unit/foo/bar.service.spec.ts`.

Run tests:

```bash
npm run test:unit
npm run test:unit:watch
```

---

## Path aliases

Both `@/` and `@test/` are available in every spec file:

```json
// test/jest-unit.json
"moduleNameMapper": {
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@test/(.*)$": "<rootDir>/test/$1"
}
```

- Use `@/` for imports from `src/`
- Use `@test/` for stubs and helpers from `test/`
- Never use relative `../../src/` paths

---

## Stubs

Shared mock data lives in `test/stubs/`. Do not inline mock objects in spec files.

### Naming

One file per domain entity, one or more `make*` factory functions per file:

```
test/stubs/user.stub.ts          → makeUser, makeSanitizedUser, makeCreateUserInput, makeUpdateUserInput
test/stubs/measurement.stub.ts   → makeMeasurement, makeUserForMeasurement
```

### Factory function shape

```ts
// test/stubs/measurement.stub.ts
import type { Measurement } from '@/measurements/types/measurements.types';

export const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
export const MEASUREMENT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export const makeMeasurement = (overrides?: Partial<Measurement>): Measurement => ({
  id: MEASUREMENT_ID,
  userId: USER_ID,
  weight: '80.00',
  date: '2024-01-15',
  // all other fields default to null
  ...overrides,
});
```

Rules:
- Accept `overrides?: Partial<T>` and spread at the end
- Return a **new object** on every call — never export a shared `const`
- Use fixed dates (`new Date('2024-01-01')`) — never `new Date()`
- Import types from `@/` — never from the DB schema

---

## Controller specs

Controllers test routing and delegation only — not business logic.

### Template

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { ResourceController } from '@/resource/resource.controller';
import { ResourceService } from '@/resource/resource.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

describe('ResourceController', () => {
  let controller: ResourceController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourceController],
      providers: [{ provide: ResourceService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ResourceController>(ResourceController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create with the correct input and return its result', async () => {
      const input = makeCreateResourceInput();
      const expected = makeResource();
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(input);

      expect(mockService.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });
  });
});
```

### What to assert

- The correct service method was called (`toHaveBeenCalledWith`)
- The return value from the service is passed through unchanged (`toEqual`)
- Do **not** re-test business logic or error branches — that belongs in the service spec

### Request object

When a route uses `@Req()` or `@User()`:

```ts
const mockRequest = { user: { id: 'user-id' } };
const result = await controller.findAll(mockRequest as unknown as Request);
```

---

## Service specs

Services test all business logic: happy paths, exceptions, and edge cases.

### Template

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResourceService } from '@/resource/resource.service';
import { ResourceRepository } from '@/resource/resource.repository';
import { makeResource } from '@test/stubs/resource.stub';

describe('ResourceService', () => {
  let service: ResourceService;

  const mockRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        { provide: ResourceRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('should return the resource when it exists', async () => {
      const resource = makeResource();
      mockRepository.findById.mockResolvedValue(resource);

      const result = await service.findOne(resource.id);

      expect(result).toEqual(resource);
    });

    it('should throw NotFoundException when resource does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Exception assertions

Always assert both the exception type and its message:

```ts
await expect(service.method(args)).rejects.toThrow(NotFoundException);
await expect(service.method(args)).rejects.toThrow('Resource not found');
```

### Services with no repository class

When a service injects the Drizzle DB token directly (no repository class):

```ts
import { getDbToken } from '@/database/database.module'; // or the actual token

const mockDb = { select: jest.fn(), insert: jest.fn() };

providers: [
  ServiceName,
  { provide: getDbToken(), useValue: mockDb },
]
```

---

## Guard specs

```ts
import { ExecutionContext } from '@nestjs/common';

const mockContext = {
  getHandler: jest.fn(),
  getClass: jest.fn(),
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({ user: { id: 'user-id' } }),
  }),
} as unknown as ExecutionContext;

it('should allow access when user has the required permission', async () => {
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['resource:read']);
  mockDb.query.mockResolvedValue([{ name: 'resource:read' }]);

  const result = await guard.canActivate(mockContext);

  expect(result).toBe(true);
});
```

### Testing private methods

Avoid it when possible. When necessary, use a typed cast:

```ts
type GuardPrivate = { getUserPermissions: (userId: string) => Promise<string[]> };
const permissions = await (guard as unknown as GuardPrivate).getUserPermissions(userId);
```

---

## Decorator specs

```ts
import * as core from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(),
}));

it('should call SetMetadata with the correct key and permissions', () => {
  Permissions('resource:read', 'resource:write');

  expect(core.SetMetadata).toHaveBeenCalledWith(
    PERMISSIONS_KEY,
    ['resource:read', 'resource:write'],
  );
});
```

---

## Utility / pure function specs

Always test pure functions. Cover:

- Happy path for each execution branch
- Edge cases (boundary values, null inputs, empty arrays)
- All sex/type-specific paths when the function branches on an enum

```ts
describe('calculateBodyFat', () => {
  it('should return null when required skinfolds are missing', () => {
    const result = calculateBodyFat({ weight: 80 }, makeUserForMeasurement());
    expect(result).toBeNull();
  });

  it('should return a numeric result for a valid male Pollock input', () => {
    const measurement = makeMeasurement({ chest: '10', abdomen: '20', thigh: '15' });
    const result = calculateBodyFat(measurement, makeUserForMeasurement({ sex: 'male' }));
    expect(result).toBeGreaterThan(0);
  });
});
```

---

## Mocking external modules

For modules like `bcrypt` or `crypto`, hoist the mock before imports:

```ts
jest.mock('bcrypt');
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-token'),
  }),
}));

import * as bcrypt from 'bcrypt';
(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
```

---

## Checklist before submitting a spec

- [ ] `afterEach(() => jest.clearAllMocks())` is present
- [ ] Stub factories from `test/stubs/` are used — no inline `{ id: '123', ... }` objects
- [ ] All test descriptions follow `it('should <behaviour> when <condition>')`
- [ ] Both exception type and message are asserted for every `rejects.toThrow`
- [ ] No `any` in test code — use `jest.Mocked<T>` or explicit types
- [ ] All imports use `@/` or `@test/` aliases
- [ ] No business logic assertions in controller specs
