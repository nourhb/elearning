import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { auth, db } = getAdminServices();
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('AuthToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token and get user claims
    const decodedToken = await auth.verifyIdToken(authToken);
    const userRole = decodedToken.role || 'student';
    const userId = decodedToken.uid;

    let courses = [];

    switch (userRole) {
      case 'admin':
        // Admin sees all courses with all statuses
        const allCoursesSnapshot = await db.collection('courses')
          .orderBy('createdAt', 'desc')
          .get();
        
        courses = await Promise.all(allCoursesSnapshot.docs.map(async (doc) => {
          const courseData = doc.data();
          const instructorDoc = await db.collection('users').doc(courseData.instructorId).get();
          const instructorData = instructorDoc.exists ? instructorDoc.data() : null;
          
          return {
            id: doc.id,
            ...courseData,
            instructorName: instructorData?.displayName || instructorData?.email || 'Unknown',
            createdAt: courseData.createdAt?.toDate?.() || courseData.createdAt,
            updatedAt: courseData.updatedAt?.toDate?.() || courseData.updatedAt,
          };
        }));
        break;

      case 'formateur':
        // Formateur sees only their own courses
        const myCoursesSnapshot = await db.collection('courses')
          .where('instructorId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
        
        courses = myCoursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        }));
        break;

      case 'student':
        // Students see only published courses
        const publishedCoursesSnapshot = await db.collection('courses')
          .where('status', '==', 'published')
          .orderBy('createdAt', 'desc')
          .get();
        
        courses = await Promise.all(publishedCoursesSnapshot.docs.map(async (doc) => {
          const courseData = doc.data();
          const instructorDoc = await db.collection('users').doc(courseData.instructorId).get();
          const instructorData = instructorDoc.exists ? instructorDoc.data() : null;
          
          // Check if student is enrolled in this course
          const enrollmentDoc = await db.collection('progress')
            .where('userId', '==', userId)
            .where('courseId', '==', doc.id)
            .limit(1)
            .get();
          
          const isEnrolled = !enrollmentDoc.empty;
          const enrollmentData = isEnrolled ? enrollmentDoc.docs[0].data() : null;
          
          return {
            id: doc.id,
            ...courseData,
            instructorName: instructorData?.displayName || instructorData?.email || 'Unknown',
            isEnrolled,
            enrollmentProgress: enrollmentData?.progress || 0,
            enrollmentStatus: enrollmentData?.status || null,
            createdAt: courseData.createdAt?.toDate?.() || courseData.createdAt,
            updatedAt: courseData.updatedAt?.toDate?.() || courseData.updatedAt,
          };
        }));
        break;

      default:
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
