import type { CreateUserInput } from './create-user.schema';
import { getAdminServices } from '@/lib/firebase-admin';

export async function createUser(input: CreateUserInput): Promise<void> {
  const { auth, db } = getAdminServices();
  const { email, password, displayName, role } = input;

  const userRecord = await auth.createUser({ email, password, displayName });
  await auth.setCustomUserClaims(userRecord.uid, { role });

  await db.collection('users').doc(userRecord.uid).set({
    email,
    displayName,
    role,
    status: 'active',
    createdAt: new Date(),
  });
}


