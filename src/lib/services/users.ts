
import { collection, doc, getDocs, updateDoc, Timestamp, Firestore } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export async function getAllUsers(clientDb: Firestore): Promise<UserProfile[]> {
    const usersCollection = collection(clientDb, 'users');
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

// Client-side function for updating user documents
export async function updateUserDocumentClient(clientDb: Firestore, uid: string, data: Partial<Omit<UserProfile, 'uid'>>) {
    const userDocRef = doc(clientDb, 'users', uid);
    await updateDoc(userDocRef, data);
}
