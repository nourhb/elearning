export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { notifyFormateurCourseApproved, notifyFormateurCourseRejected } from '@/lib/services/admin-notifications';

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { courseId, action, reason } = await request.json();

    if (!courseId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the course
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseData = courseDoc.data();
    
    // Check if course is pending approval
    if (courseData?.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Course is not pending approval' }, { status: 400 });
    }

    // Update course status
    const newStatus = action === 'approve' ? 'published' : 'rejected';
    await courseRef.update({
      status: newStatus,
      approvedBy: decodedToken.uid,
      approvedAt: new Date(),
      approvalReason: reason || null,
      updatedAt: new Date()
    });

    // Send notification to formateur
    try {
      if (action === 'approve') {
        await notifyFormateurCourseApproved(courseData, decodedToken.displayName || 'Admin');
      } else {
        await notifyFormateurCourseRejected(courseData, decodedToken.displayName || 'Admin', reason);
      }
    } catch (error) {
      console.error('Failed to send formateur notification:', error);
      // Don't fail the approval if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      message: `Course ${action}d successfully`,
      status: newStatus
    });
  } catch (error) {
    console.error('Error processing course approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
