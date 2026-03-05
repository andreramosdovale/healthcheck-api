# Generating a New Module

When generating a new module, follow this checklist in order.

---

## 1. File naming

All files use kebab-case. Never use PascalCase for file names.

```
users.controller.ts   ✓
UsersController.ts    ✗
```

---

## 2. Files to create

For a module named `resource-name`:

```
src/resource-name/
  dto/
    create-resource-name.dto.ts
    update-resource-name.dto.ts
  types/
    resource-name.types.ts
  resource-name.controller.ts
  resource-name.service.ts
  resource-name.repository.ts
  resource-name.module.ts
```

---

## 3. Minimal skeleton per file

### Controller

```ts
@Controller('resource-name')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourceNameController {
  constructor(private readonly resourceNameService: ResourceNameService) {}
}
```

### Service

```ts
@Injectable()
export class ResourceNameService {
  constructor(private readonly resourceNameRepository: ResourceNameRepository) {}
}
```

### Repository

```ts
@Injectable()
export class ResourceNameRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}
}
```

### Module

```ts
@Module({
  controllers: [ResourceNameController],
  providers: [ResourceNameService, ResourceNameRepository],
  exports: [ResourceNameService], // only if consumed by other modules
})
export class ResourceNameModule {}
```

---

## 4. Register in AppModule

After creating the module file, add it to `src/app.module.ts`:

```ts
imports: [
  // existing modules...
  ResourceNameModule,
],
```

---

## 5. Register permissions in the seed

If the module introduces new routes, add its permission strings to the seed.
See `database-seeds.md` for full instructions.

Short version:

1. Add entries to `src/database/seeds/permissions.seed.ts`:
   ```ts
   { name: 'resource-name:create', description: 'Create resource name' },
   { name: 'resource-name:read',   description: 'Read resource name' },
   { name: 'resource-name:update', description: 'Update resource name' },
   { name: 'resource-name:delete', description: 'Delete resource name' },
   ```

2. Assign them to roles in `src/database/seeds/role-permissions.seed.ts`.

3. The permission strings must exactly match the `@Permissions(...)` strings
   used in the controller.

---

## 6. Checklist before finishing

- [ ] All files use kebab-case names
- [ ] Controller has `@UseGuards(JwtAuthGuard, PermissionsGuard)`
- [ ] Each route has `@Permissions('resource:action')`
- [ ] Service only calls the repository — no direct DB access
- [ ] Repository is the only file that imports from `@/database/`
- [ ] DTOs use `class-validator` decorators
- [ ] Types file defines shared interfaces used by service and repository
- [ ] Repository and service are listed in `providers[]` in the module
- [ ] Module is imported in `app.module.ts`
- [ ] Permission strings added to `permissions.seed.ts` and assigned in `role-permissions.seed.ts`
- [ ] Stub file created at `test/stubs/resource-name.stub.ts`
