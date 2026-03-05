# Refactor Guidelines

When refactoring existing code to match the target architecture:

## Target architecture

Controller → Service → Repository

The repository is the only layer allowed to access the database.

---

## Steps

1. Identify all database access inside the service (ORM imports, query calls)

2. Create a repository file if it does not exist:
   `module-name/module-name.repository.ts`

3. Move all database logic from the service into the repository.
   Repository methods should return typed domain objects, `null`, or empty arrays.
   They must not throw HTTP exceptions.

4. Register the repository in the module's `providers` array:

   ```ts
   @Module({
     providers: [ModuleService, ModuleRepository], // add repository here
   })
   ```

5. Inject the repository into the service via the constructor and update all call sites:

   ```ts
   constructor(private readonly moduleRepository: ModuleRepository) {}
   ```

6. Remove the direct DB injection from the service (`@Inject(DRIZZLE)`).

7. Create a `types/module-name.types.ts` file if the module does not have one.
   Replace all inline object types in the service and repository with named interfaces.

8. Verify that the service no longer imports anything from `@/database/`.

---

## Cross-module dependencies

If the refactored repository is needed by another module's service:

- Add `exports: [ModuleRepository]` to the source module
- Import the source module in the consuming module's `imports` array
- Never import a repository class directly across module boundaries — import the module

---

## What NOT to change during a refactor

- Do not alter business logic while extracting the repository layer.
  Structural changes and logic changes should be separate commits.
- Do not change DTO shapes or API contracts unless explicitly requested.
