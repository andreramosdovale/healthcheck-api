import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema';

import { seedRoles } from './roles.seed';
import { seedPermissions } from './permissions.seed';
import { seedRolePermissions } from './role-permissions.seed';
import { seedUsers } from './users.seed';
import { seedUserRoles } from './user-roles.seed';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Seeding database...\n');

  const roles = await seedRoles(db);
  const permissions = await seedPermissions(db);
  await seedRolePermissions(db, roles, permissions);
  const users = await seedUsers(db);
  await seedUserRoles(db, users, roles);

  console.log('\n🎉 Seed completed!');
  console.log('\n📋 Usuários de teste:');
  console.log('   admin@healthcheck.com    / Test@123 (admin)');
  console.log('   user@healthcheck.com     / Test@123 (user)');
  console.log('   professional@healthcheck.com / Test@123 (professional)');

  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
