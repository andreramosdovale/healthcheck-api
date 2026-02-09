import { users } from '../schema';
import type { DrizzleDB } from '../db';
import * as bcrypt from 'bcrypt';

export async function seedUsers(db: DrizzleDB) {
  console.log('Creating users...');

  const passwordHash = await bcrypt.hash('Test@123', 12);

  await db
    .insert(users)
    .values([
      {
        email: 'admin@healthcheck.com',
        nickname: 'admin',
        passwordHash,
        name: 'Administrador',
        birthDate: '1990-01-01',
        sex: 'male',
        height: '175.00',
        plan: 'premium',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
      {
        email: 'user@healthcheck.com',
        nickname: 'user_teste',
        passwordHash,
        name: 'Usuário Teste',
        birthDate: '1995-05-15',
        sex: 'female',
        height: '165.00',
        plan: 'free',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
      {
        email: 'professional@healthcheck.com',
        nickname: 'profissional',
        passwordHash,
        name: 'Profissional Teste',
        birthDate: '1985-10-20',
        sex: 'male',
        height: '180.00',
        plan: 'premium',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    ])
    .onConflictDoNothing();

  const all = await db.select().from(users);

  console.log(`✅ Users: ${all.length} total`);

  return all;
}
