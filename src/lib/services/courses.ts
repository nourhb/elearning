
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, serverTimestamp, Timestamp, Firestore } from 'firebase/firestore';
import type { Course, Module, Lesson } from '@/lib/types';

// Sample data to be used if the database is empty
export const sampleLessons: Lesson[] = [
    { id: 'l1-1', title: 'What is AI?', contentType: 'video', videoSource: 'youtube', url: 'https://www.youtube.com/watch?v=ad79nYk2keg', description: 'An introduction to the concepts of Artificial Intelligence.' },
    { id: 'l1-2', title: 'History of AI', contentType: 'document', url: '#', description: 'A PDF document covering the history of AI.' },
];

export const sampleModules: Module[] = [
  { id: 'm1', title: 'Module 1: Introduction', lessons: sampleLessons },
  { id: 'm2', title: 'Module 2: Deep Dive', lessons: [] },
  { id: 'm3', title: 'Module 3: Advanced Concepts', lessons: [] },
];


export const sampleCourses: Course[] = [
  {
    id: 'intro-to-ai',
    title: 'Introduction to Artificial Intelligence',
    description: 'Learn the fundamentals of AI, machine learning, and neural networks.',
    imageUrl: '/Countries-page-image-placeholder-800x500.webp',
    aiHint: 'abstract brain',
    instructorId: 'formateur-user-id',
    status: 'Published',
    studentCount: 215,
    modules: sampleModules,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'advanced-react',
    title: 'Advanced React Patterns',
    description: 'Deep dive into React hooks, context, and performance optimization.',
    imageUrl: '/Countries-page-image-placeholder-800x500.webp',
    aiHint: 'glowing code',
    instructorId: 'formateur-user-id',
    status: 'Published',
    studentCount: 130,
    modules: sampleModules,
    createdAt: new Date('2024-04-15'),
  },
  {
    id: 'nextjs-for-beginners',
    title: 'Next.js for Beginners',
    description: 'Build modern, server-rendered React applications with Next.js.',
    imageUrl: '/Countries-page-image-placeholder-800x500.webp',
    aiHint: 'abstract lines',
    instructorId: 'another-formateur-id',
    status: 'Published',
    studentCount: 350,
    modules: sampleModules,
    createdAt: new Date('2024-05-20'),
  },
  {
    id: 'ux-design-fundamentals',
    title: 'UX Design Fundamentals',
    description: 'A comprehensive guide to user experience design principles and practices.',
    imageUrl: '/Countries-page-image-placeholder-800x500.webp',
    aiHint: 'wireframe sketch',
    instructorId: 'formateur-user-id',
    status: 'Draft',
    studentCount: 0,
    modules: sampleModules,
    createdAt: new Date('2024-07-10'),
  },
  {
    id: 'data-science-python',
    title: 'Data Science with Python',
    description: 'Explore data analysis, visualization, and machine learning with Python.',
    imageUrl: '/Countries-page-image-placeholder-800x500.webp',
    aiHint: 'network graph',
    instructorId: 'another-formateur-id',
    status: 'Published',
    studentCount: 180,
    modules: sampleModules,
    createdAt: new Date('2024-06-05'),
  },
  {
    id: 'intro-to-cybersecurity',
    title: 'Introduction to Cybersecurity',
    description: 'Understand the basics of cybersecurity and how to protect digital assets.',
    imageUrl: '/Countries-page-image-placeholder-800x500.webp',
    aiHint: 'digital lock',
    instructorId: 'formateur-user-id',
    status: 'Published',
    studentCount: 95,
    modules: sampleModules,
    createdAt: new Date('2024-02-10'),
  },
];


const mapCourseFromDoc = (doc: any) => {
    const data = doc.data();
    const course: Course = {
       id: doc.id,
       title: data.title,
       description: data.description,
       imageUrl: data.imageUrl,
       aiHint: data.aiHint,
       instructorId: data.instructorId,
       status: data.status,
       studentCount: data.studentCount || 0,
       modules: data.modules || [],
       createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    };
    return course;
}


export async function getAllCourses(db: Firestore): Promise<Course[]> {
  const coursesCollection = collection(db, 'courses');
  const querySnapshot = await getDocs(coursesCollection);

  if (querySnapshot.empty) {
    console.log('No courses found in Firestore, returning sample data.');
    return sampleCourses;
  }

  return querySnapshot.docs.map(mapCourseFromDoc);
}

export async function getCoursesByInstructor(db: Firestore, instructorId: string): Promise<Course[]> {
  const coursesCollection = collection(db, 'courses');
  const q = query(coursesCollection, where('instructorId', '==', instructorId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty && (instructorId === 'formateur-user-id' || instructorId === 'another-formateur-id')) {
     console.log('No courses found for instructor in Firestore, returning sample data.');
     return sampleCourses
      .filter(c => c.instructorId === instructorId);
  }

  return querySnapshot.docs.map(mapCourseFromDoc);
}

export async function getCourseById(db: Firestore, courseId: string): Promise<Course | null> {
  const docRef = doc(db, 'courses', courseId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return mapCourseFromDoc(docSnap);
  }
  
  const sample = sampleCourses.find(c => c.id === courseId);
  if (sample) {
      return sample;
  }
  
  return null;
}
