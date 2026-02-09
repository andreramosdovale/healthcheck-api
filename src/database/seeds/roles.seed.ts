import { roles } from '../schema';
import type { DrizzleDB } from '../db';

export async function seedRoles(db: DrizzleDB) {
  console.log('Creating roles...');

  await db
    .insert(roles)
    .values([
      {
        name: 'admin',
        description: 'Administrador do sistema',
        isSystem: true,
      },
      {
        name: 'user',
        description: 'Usuário padrão',
        isSystem: true,
      },
      {
        name: 'professional',
        description: 'Profissional de saúde',
        isSystem: true,
      },
    ])
    .onConflictDoNothing();

  const created = await db.select().from(roles);

  console.log(`✅ Roles: ${created.length} total`);

  return created;
}
