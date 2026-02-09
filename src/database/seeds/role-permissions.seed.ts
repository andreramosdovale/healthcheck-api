import { rolePermissions } from '../schema';
import type { DrizzleDB } from '../db';
import type { Role, Permission } from '../schema';

export async function seedRolePermissions(
  db: DrizzleDB,
  roles: Role[],
  permissions: Permission[],
) {
  console.log('Assigning permissions to roles...');

  const getRole = (name: string) => roles.find((r) => r.name === name)!;
  const getPermission = (name: string) =>
    permissions.find((p) => p.name === name)!;

  const adminRole = getRole('admin');
  const userRole = getRole('user');
  const professionalRole = getRole('professional');

  // Admin: todas as permissões
  const adminPermissions = permissions.map((p) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  // User: permissões básicas
  const userPermissions = [
    'users:read',
    'users:update',
    'measurements:create',
    'measurements:read',
    'measurements:update',
    'measurements:delete',
  ].map((name) => ({
    roleId: userRole.id,
    permissionId: getPermission(name).id,
  }));

  // Professional: user + extras
  const professionalPermissions = [
    'users:read',
    'users:update',
    'measurements:create',
    'measurements:read',
    'measurements:update',
    'measurements:delete',
  ].map((name) => ({
    roleId: professionalRole.id,
    permissionId: getPermission(name).id,
  }));

  await db
    .insert(rolePermissions)
    .values([
      ...adminPermissions,
      ...userPermissions,
      ...professionalPermissions,
    ])
    .onConflictDoNothing();

  console.log(`✅ Role permissions assigned`);
}
