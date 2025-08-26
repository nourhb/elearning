export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('Enrollment API called');
    const { auth, db } = getAdminServices();
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('AuthToken')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'You must be logged in to enroll in courses.' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    // Verify the token and get user info
    const decodedToken = await auth.verifyIdToken(authToken);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role || 'student';
    
    console.log('User enrollment request:', { userId, userRole, courseId });

    // Prevent admin users from enrolling in courses
    if (userRole === 'admin') {
      return NextResponse.json({ 
        error: 'Administrators cannot enroll in courses. Only students can enroll.' 
      }, { status: 403 });
    }

    // Check if the user is already enrolled
    const progressRef = db.collection('progress');
    const q = progressRef.where('userId', '==', userId).where('courseId', '==', courseId);
    const existingEnrollment = await q.get();

    if (!existingEnrollment.empty) {
      return NextResponse.json({ 
        error: 'You are already enrolled in this course.' 
      }, { status: 400 });
    }
    
    // Check if there's already a pending request
    const requestsRef = db.collection('enrollmentRequests');
    const requestQuery = requestsRef.where('studentId', '==', userId)
                                 .where('courseId', '==', courseId)
                                 .where('status', '==', 'pending');
    const existingRequest = await requestQuery.get();

    if (!existingRequest.empty) {
      return NextResponse.json({ 
        error: 'You already have a pending enrollment request for this course.' 
      }, { status: 400 });
    }
    
    // Fetch course details
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }
    
    const course = courseDoc.data();
    console.log('Course found:', { id: courseId, title: course?.title, instructorId: course?.instructorId });

    // Check if course requires admin approval
    const requiresApproval = course?.requiresApproval !== false; // Default to true if not specified
    
    if (requiresApproval) {
      // Create enrollment request for admin approval (no immediate access)
      const { createEnrollmentRequest } = await import('@/lib/services/enrollment-requests');
      
      const userRecord = await auth.getUser(userId);
      
      const enrollmentRequest = await createEnrollmentRequest(
        db,
        userId,
        userRecord.displayName || 'Unknown User',
        userRecord.email || '',
        courseId,
        course?.title || 'Unknown Course',
        course?.instructorId || 'unknown',
        undefined // Optional request message
      );

      console.log('Enrollment request created successfully:', enrollmentRequest.id);

      return NextResponse.json({ 
        success: true, 
        message: 'Enrollment request submitted! You will be notified when your request is approved.',
        requestId: enrollmentRequest.id,
        requiresApproval: true
      });
    } else {
      // Course doesn't require approval - immediate enrollment
      await progressRef.add({
        userId,
        courseId,
        progress: 0,
        completed: false,
        completedLessons: [],
        startedAt: new Date(),
        status: 'active'
      });

      console.log('Immediate enrollment created successfully');

      return NextResponse.json({ 
        success: true, 
        message: 'Enrollment successful! You can now start learning.',
        requiresApproval: false
      });
    }

  } catch (error: any) {
    console.error('Enrollment API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to submit enrollment request.';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid authentication token.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
