# Module Structure

Each module uses a flat structure. Do NOT create subfolders for controller or service.

```
module-name/
  dto/
    create-module-name.dto.ts
    update-module-name.dto.ts
  types/
    module-name.types.ts
  module-name.controller.ts
  module-name.service.ts
  module-name.repository.ts
  module-name.module.ts
```

All files use kebab-case. The module name is the prefix for every file.

## Example: users module

```
users/
  dto/
    create-user.dto.ts
    update-user.dto.ts
  types/
    users.types.ts
  users.controller.ts
  users.service.ts
  users.repository.ts
  users.module.ts
```

## Optional folders (only when needed)

- `utils/` — pure calculation helpers with no side effects (no DI, no DB access)
- `guards/` — guards specific to this module
- `strategies/` — Passport strategies specific to this module

Shared guards and decorators live in `src/common/`, not inside the module.

## Notes on existing modules

`auth` and `measurements` predate the repository rule and access the database
directly from the service. Do not use them as reference for new modules.
New modules must follow the structure above.
