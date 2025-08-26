
import { collection, getDocs, query, where, Timestamp, Firestore, DocumentData, FirestoreDataConverter } from 'firebase/firestore';
import type { UserProgress } from '@/lib/types';

const progressConverter: FirestoreDataConverter<UserProgress> = {
    toFirestore: (progress: UserProgress): DocumentData => {
        const data: any = { ...progress };
        // Convert Date objects to Timestamps
        if (progress.startedAt) {
            data.startedAt = Timestamp.fromDate(progress.startedAt);
        }
        if (progress.completedAt) {
            data.completedAt = Timestamp.fromDate(progress.completedAt);
        }
        // Remove the id field before writing to Firestore
        delete data.id;
        return data;
    },
    fromFirestore: (snapshot, options): UserProgress => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            userId: data.userId,
            courseId: data.courseId,
            progress: data.progress,
            completed: data.completed,
            completedLessons: data.completedLessons || [],
            startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : undefined,
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : undefined,
        } as UserProgress;
    }
};


export async function getProgressForUser(db: Firestore, userId: string): Promise<UserProgress[]> {
  const progressCollection = collection(db, 'progress').withConverter(progressConverter);
  const q = query(progressCollection, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}
