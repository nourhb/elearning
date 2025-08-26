
import { collection, getDocs, query, where, doc, getDoc, Timestamp, Firestore } from 'firebase/firestore';
import type { Course } from '@/lib/types';

const mapCourseFromDoc = (doc: any): Course => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        aiHint: data.aiHint,
        instructorId: data.instructorId,
        status: data.status,
        studentCount: data.studentCount || 0,
        modules: data.modules || [],
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    } as Course;
};

export async function getAllCourses(db: Firestore): Promise<Course[]> {
    const coursesCollection = collection(db, 'courses');
    const querySnapshot = await getDocs(coursesCollection);
    return querySnapshot.docs.map(mapCourseFromDoc);
}

export async function getCoursesByInstructor(db: Firestore, instructorId: string): Promise<Course[]> {
    const coursesCollection = collection(db, 'courses');
    const q = query(coursesCollection, where('instructorId', '==', instructorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapCourseFromDoc);
}

export async function getCourseById(db: Firestore, courseId: string): Promise<Course | null> {
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return mapCourseFromDoc(docSnap);
}
