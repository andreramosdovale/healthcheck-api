# Database Seeds

Seeds populate the database with initial or development data.
They live in `src/database/seeds/` and run outside the NestJS application context.

---

## Structure

```
src/database/seeds/
  index.ts              ← entry point, orchestrates execution order
  roles.seed.ts
  permissions.seed.ts
  role-permissions.seed.ts
  users.seed.ts
  user-roles.seed.ts
  measurements.seed.ts
```

When adding a new module that requires reference data (e.g. new roles, new
permission strings), add a seed file for it and register it in `index.ts`.

---

## Running seeds

```bash
npm run db:seed
```

This executes `src/database/seeds/index.ts` directly via `ts-node`, outside NestJS.
Seeds connect to the database using `DATABASE_URL` from the environment — make sure
`.env` is loaded before running.

---

## Writing a seed file

Each seed file exports a single async function named `seed<Entity>`.
It receives the Drizzle `db` instance and returns the inserted rows so dependent
seeds can reference them:

```ts
// src/database/seeds/resources.seed.ts
import { resources } from '../schema';
import type { DrizzleDB } from '../db';

export async function seedResources(db: DrizzleDB) {
  console.log('Creating resources...');

  await db
    .insert(resources)
    .values([
      { name: 'resource-a', description: 'Description A' },
      { name: 'resource-b', description: 'Description B' },
    ])
    .onConflictDoNothing(); // seeds must be idempotent

  const created = await db.select().from(resources);

  console.log(`✅ Resources: ${created.length} total`);

  return created;
}
```

Rules:

- **Always use `.onConflictDoNothing()`** — seeds must be safe to run multiple times
  without duplicating or failing on existing data
- **Return the inserted rows** — downstream seeds that depend on this data (e.g.
  assigning permissions to roles) receive the rows as function arguments
- **Log progress** with `console.log` so the output of `db:seed` is readable
- **Never use NestJS services or DI** inside a seed — seeds connect directly to the DB
- **Never hardcode production data** — seeds are for development and testing only

---

## Execution order in index.ts

The order matters when seeds have foreign-key dependencies.
Register a new seed in `index.ts` after all tables it depends on have been seeded:

```ts
// src/database/seeds/index.ts
const roles       = await seedRoles(db);
const permissions = await seedPermissions(db);
await seedRolePermissions(db, roles, permissions); // depends on both above
const users       = await seedUsers(db);
await seedUserRoles(db, users, roles);             // depends on users and roles
await seedResources(db);                           // no dependencies — can go anywhere
```

---

## Test accounts created by seeds

| Email | Password | Role |
|---|---|---|
| admin@healthcheck.com | Test@123 | admin |
| user@healthcheck.com | Test@123 | user |
| professional@healthcheck.com | Test@123 | professional |

These credentials are for local development only.

---

## Adding permissions for a new module

When a new module introduces new routes, add its permission strings to
`permissions.seed.ts` following the `resource:action` format:

```ts
{ name: 'resource-name:create', description: 'Create resource' },
{ name: 'resource-name:read',   description: 'Read resource' },
{ name: 'resource-name:update', description: 'Update resource' },
{ name: 'resource-name:delete', description: 'Delete resource' },
```

Then assign them to the appropriate roles in `role-permissions.seed.ts`.
The permission strings in the seed must exactly match the strings used in
`@Permissions(...)` decorators in the controllers.
