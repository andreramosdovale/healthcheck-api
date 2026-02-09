import { userRoles } from '../schema';
import type { DrizzleDB } from '../db';
import type { User, Role } from '../schema';

export async function seedUserRoles(
  db: DrizzleDB,
  users: User[],
  roles: Role[],
) {
  console.log('Assigning roles to users...');

  const getUser = (nickname: string) =>
    users.find((u) => u.nickname === nickname)!;
  const getRole = (name: string) => roles.find((r) => r.name === name)!;

  await db
    .insert(userRoles)
    .values([
      // Admin user -> admin role
      {
        userId: getUser('admin').id,
        roleId: getRole('admin').id,
      },
      // User teste -> user role
      {
        userId: getUser('user_teste').id,
        roleId: getRole('user').id,
      },
      // Professional -> professional role
      {
        userId: getUser('profissional').id,
        roleId: getRole('professional').id,
      },
    ])
    .onConflictDoNothing();

  console.log(`✅ User roles assigned`);
}
