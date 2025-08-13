
import { collection, doc, setDoc, getDocs, updateDoc, Timestamp, Firestore } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { getAdminServices } from '../firebase-admin';

// Sample data to be used if the database is empty
export const sampleUsers: UserProfile[] = [
    {
        uid: 'admin-user-id',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'admin',
        createdAt: new Date('2024-01-10'),
        status: 'active',
    },
    {
        uid: 'formateur-user-id',
        email: 'formateur@example.com',
        displayName: 'Formateur User',
        role: 'formateur',
        createdAt: new Date('2024-02-15'),
        status: 'active',
    },
    {
        uid: 'another-formateur-id',
        email: 'formateur2@example.com',
        displayName: 'Another Formateur',
        role: 'formateur',
        createdAt: new Date('2024-03-01'),
        status: 'active',
    },
    {
        uid: 'student-user-id',
        email: 'student@example.com',
        displayName: 'Student User',
        role: 'student',
        createdAt: new Date('2024-03-20'),
        status: 'active',
    },
    {
        uid: 'student-user-id-2',
        email: 'student2@example.com',
        displayName: 'Jane Doe',
        role: 'student',
        createdAt: new Date('2024-04-05'),
        status: 'active',
    },
    {
        uid: 'student-user-id-3',
        email: 'student3@example.com',
        displayName: 'John Smith',
        role: 'student',
        createdAt: new Date('2024-04-12'),
        status: 'suspended',
    },
    {
        uid: 'student-user-id-4',
        email: 'student4@example.com',
        displayName: 'Alice Johnson',
        role: 'student',
        createdAt: new Date('2024-05-01'),
        status: 'active',
    },
    {
        uid: 'student-user-id-5',
        email: 'student5@example.com',
        displayName: 'Bob Williams',
        role: 'student',
        createdAt: new Date('2024-05-18'),
        status: 'active',
    },
    {
        uid: 'student-user-id-6',
        email: 'student6@example.com',
        displayName: 'Charlie Brown',
        role: 'student',
        createdAt: new Date('2024-06-02'),
        status: 'active',
    },
    {
        uid: 'student-user-id-7',
        email: 'student7@example.com',
        displayName: 'Diana Prince',
        role: 'student',
        createdAt: new Date('2024-06-25'),
        status: 'active',
    },
    {
        uid: 'student-user-id-8',
        email: 'student8@example.com',
        displayName: 'Ethan Hunt',
        role: 'student',
        createdAt: new Date('2024-07-03'),
        status: 'active',
    },
    {
        uid: 'student-user-id-9',
        email: 'student9@example.com',
        displayName: 'Fiona Glenanne',
        role: 'student',
        createdAt: new Date('2024-07-15'),
        status: 'active',
    },
    {
        uid: 'student-user-id-10',
        email: 'student10@example.com',
        displayName: 'George Costanza',
        role: 'student',
        createdAt: new Date('2024-07-22'),
        status: 'active',
    }
];


/**
 * Fetches all user documents from Firestore.
 * This function uses the client-side SDK and is safe to call from components.
 * @param clientDb The Firestore instance from the client.
 * @returns A promise that resolves to an array of user profiles.
 */
export async function getAllUsers(clientDb: Firestore): Promise<UserProfile[]> {
    const usersCollection = collection(clientDb, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    if (querySnapshot.empty) {
        console.log('No users found in Firestore, returning sample data.');
        return sampleUsers;
    }
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: doc.id,
            ...data,
            // Ensure createdAt is a Date object
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as UserProfile
    });
}


/**
 * Updates a user document in Firestore using the admin SDK.
 * @param uid The user's unique ID.
 * @param data The partial data to update.
 */
export async function updateUserDocument(uid: string, data: Partial<Omit<UserProfile, 'uid'>>) {
    const { db } = getAdminServices();
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
}
