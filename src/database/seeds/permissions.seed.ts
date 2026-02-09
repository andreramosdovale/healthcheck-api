import { permissions } from '../schema';
import type { DrizzleDB } from '../db';

export async function seedPermissions(db: DrizzleDB) {
  console.log('Creating permissions...');

  await db
    .insert(permissions)
    .values([
      // Users
      { name: 'users:read', description: 'Ver usuários', group: 'users' },
      { name: 'users:update', description: 'Editar usuários', group: 'users' },
      { name: 'users:delete', description: 'Deletar usuários', group: 'users' },

      // Measurements
      {
        name: 'measurements:create',
        description: 'Criar medição',
        group: 'measurements',
      },
      {
        name: 'measurements:read',
        description: 'Ver medições',
        group: 'measurements',
      },
      {
        name: 'measurements:update',
        description: 'Editar medições',
        group: 'measurements',
      },
      {
        name: 'measurements:delete',
        description: 'Deletar medições',
        group: 'measurements',
      },

      // Admin
      {
        name: 'admin:access',
        description: 'Acessar painel admin',
        group: 'admin',
      },
      { name: 'roles:manage', description: 'Gerenciar roles', group: 'admin' },
      {
        name: 'permissions:manage',
        description: 'Gerenciar permissões',
        group: 'admin',
      },
    ])
    .onConflictDoNothing();

  const all = await db.select().from(permissions);

  console.log(`✅ Permissions: ${all.length} total`);

  return all;
}
