import { getAdminServices } from '@/lib/firebase-admin';

export async function deleteUser(params: { uid: string }): Promise<void> {
    const { uid } = params;
    const { auth, db } = getAdminServices();
    // Delete user auth record
    await auth.deleteUser(uid);
    // Delete user profile document
    await db.collection('users').doc(uid).delete();
    // Optionally, delete progress documents
    const progressSnap = await db.collection('progress').where('userId', '==', uid).get();
    const batch = db.batch();
    progressSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}


