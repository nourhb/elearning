
'use server';

import { getAdminServices } from '@/lib/firebase-admin';
import type { UserProgress } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

interface UpdateProgressInput {
    userId: string;
    courseId: string;
    lessonId: string;
    totalLessons: number;
}

export async function updateUserProgressAction(input: UpdateProgressInput): Promise<{ success: boolean; progress?: UserProgress; message?: string; }> {
    const { userId, courseId, lessonId, totalLessons } = input;
    const { db } = getAdminServices();

    try {
        const progressCollection = db.collection('progress');
        const q = progressCollection.where('userId', '==', userId).where('courseId', '==', courseId);

        const finalProgress = await db.runTransaction(async (transaction) => {
            const progressSnap = await transaction.get(q);

            let progressDocRef;
            let currentProgressData: UserProgress;

            if (progressSnap.empty) {
                progressDocRef = progressCollection.doc(); // Creates a new doc reference
                 currentProgressData = {
                    id: progressDocRef.id,
                    userId,
                    courseId,
                    progress: 0,
                    completed: false,
                    completedLessons: [],
                    startedAt: new Date(),
                };
            } else {
                const progressDoc = progressSnap.docs[0];
                progressDocRef = progressDoc.ref;
                const data = progressDoc.data();
                currentProgressData = {
                     id: progressDoc.id,
                    ...data,
                    startedAt: (data.startedAt as Timestamp)?.toDate(),
                    completedAt: (data.completedAt as Timestamp)?.toDate(),
                } as UserProgress;
            }

            const completedLessons = new Set(currentProgressData.completedLessons || []);
            if (completedLessons.has(lessonId)) {
                return currentProgressData; // Already completed, no changes needed
            }

            completedLessons.add(lessonId);
            const newCompletedLessonsArray = Array.from(completedLessons);
            const newProgressPercentage = totalLessons > 0 ? Math.round((newCompletedLessonsArray.length / totalLessons) * 100) : 0;
            const isCompleted = newProgressPercentage >= 100;

            const updatedData: Partial<UserProgress> = {
                completedLessons: newCompletedLessonsArray,
                progress: newProgressPercentage,
                completed: isCompleted,
            };

            if (isCompleted && !currentProgressData.completedAt) {
                updatedData.completedAt = new Date();
            }

            if(progressSnap.empty) {
                transaction.set(progressDocRef, { ...currentProgressData, ...updatedData });
            } else {
                transaction.update(progressDocRef, updatedData);
            }
            
            return { ...currentProgressData, ...updatedData };
        });

        // Convert dates to string for serialization
        const serializableProgress = {
            ...finalProgress,
            startedAt: finalProgress.startedAt?.toISOString(),
            completedAt: finalProgress.completedAt?.toISOString(),
        }

        return { success: true, progress: serializableProgress as any };

    } catch (error: any) {
        console.error("Failed to update progress via server action:", error);
        return { success: false, message: error.message || 'Failed to update progress.' };
    }
}
