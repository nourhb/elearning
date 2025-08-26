import { doc, updateDoc, Firestore } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { getAdminServices } from '../firebase-admin';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

export async function updateUserDocument(uid: string, data: Partial<Omit<UserProfile, 'uid'>>) {
    const { db } = getAdminServices();
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
}

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
    const { db } = getAdminServices();
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as UserProfile;
    });
}
