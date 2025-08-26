import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { getCourseImageUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
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

    // Only allow admin to access this endpoint
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all courses
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    let updatedCount = 0;
    const batch = db.batch();

    // Check each course for blob URLs
    for (const course of courses) {
      const currentImageUrl = course.imageUrl || '';
      
      // Check if the current URL is a blob URL
      if (currentImageUrl.startsWith('blob:')) {
        console.log(`Found blob URL in course ${course.id}: ${currentImageUrl}`);
        
        // Get a proper placeholder image URL
        const fixedImageUrl = getCourseImageUrl({
          imageUrl: '',
          title: course.title || 'Course'
        });
        
        // Update the course with the fixed image URL
        const courseRef = db.collection('courses').doc(course.id);
        batch.update(courseRef, {
          imageUrl: fixedImageUrl,
          updatedAt: new Date()
        });
        
        updatedCount++;
      }
    }

    // Commit all updates
    if (updatedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true,
      message: `Cleaned up ${updatedCount} courses with blob URLs`,
      updatedCount
    });

  } catch (error) {
    console.error('Error cleaning up blob URLs:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup blob URLs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
