
import { collection, getDocs, query, where, Timestamp, Firestore, doc, setDoc, getDoc, DocumentData, FirestoreDataConverter, runTransaction } from 'firebase/firestore';
import type { UserProgress } from '@/lib/types';

// Sample data to be used if the database is empty
export const sampleProgress: UserProgress[] = [
    {
        id: 'progress-1',
        userId: 'student-user-id',
        courseId: 'intro-to-ai',
        progress: 75,
        completed: false,
        completedLessons: ['l1-1'],
        startedAt: new Date('2024-07-01'),
    },
    {
        id: 'progress-2',
        userId: 'student-user-id',
        courseId: 'advanced-react',
        progress: 100,
        completed: true,
        completedLessons: ['l1-1', 'l1-2'],
        startedAt: new Date('2024-06-15'),
        completedAt: new Date('2024-07-20'),
    },
    {
        id: 'progress-3',
        userId: 'student-user-id-2',
        courseId: 'nextjs-for-beginners',
        progress: 25,
        completed: false,
        completedLessons: [],
        startedAt: new Date('2024-07-10'),
    },
    {
        id: 'progress-4',
        userId: 'student-user-id-3',
        courseId: 'intro-to-ai',
        progress: 100,
        completed: true,
        completedLessons: ['l1-1', 'l1-2'],
        startedAt: new Date('2024-05-01'),
        completedAt: new Date('2024-06-01'),
    },
    {
        id: 'progress-5',
        userId: 'student-user-id-4',
        courseId: 'data-science-python',
        progress: 50,
        completed: false,
        completedLessons: ['l1-1'],
        startedAt: new Date('2024-07-18'),
    },
     {
        id: 'progress-6',
        userId: 'student-user-id-5',
        courseId: 'intro-to-cybersecurity',
        progress: 10,
        completed: false,
        completedLessons: [],
        startedAt: new Date('2024-07-21'),
    },
    {
        id: 'progress-7',
        userId: 'student-user-id-6',
        courseId: 'advanced-react',
        progress: 90,
        completed: false,
        completedLessons: ['l1-1'],
        startedAt: new Date('2024-07-05'),
    },
];


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
  
  if (querySnapshot.empty && sampleProgress.some(p => p.userId === userId)) {
      console.log('No progress found for user in Firestore, returning sample data.');
      return sampleProgress.filter(p => p.userId === userId);
  }
  
  return querySnapshot.docs.map(doc => doc.data());
}
