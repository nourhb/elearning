export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { createNotification } from '@/lib/services/notifications';

export async function POST(request: NextRequest) {
  try {
    const { auth, db } = getAdminServices();
    
    // Get the auth token from cookies
    const cookieStore = await request.cookies;
    const authToken = cookieStore.get('AuthToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the token and get user claims
    const decodedToken = await auth.verifyIdToken(authToken);
    const userRole = decodedToken.role || 'student';

    // Only allow admin to approve enrollment requests
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either "approve" or "deny"' }, { status: 400 });
    }

    // Get the enrollment request
    const requestRef = db.collection('enrollmentRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Enrollment request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    if (!requestData) {
      return NextResponse.json({ error: 'Invalid enrollment request data' }, { status: 400 });
    }

    // Update the enrollment request status
    await requestRef.update({
      status: action === 'approve' ? 'approved' : 'denied',
      reviewedBy: decodedToken.uid,
      reviewedAt: new Date(),
    });

    // Update the progress record if it exists
    const progressQuery = db.collection('progress')
      .where('enrollmentRequestId', '==', requestId);
    const progressSnapshot = await progressQuery.get();

    if (!progressSnapshot.empty) {
      const progressDoc = progressSnapshot.docs[0];
      await progressDoc.ref.update({
        status: action === 'approve' ? 'enrolled' : 'denied',
        reviewedAt: new Date(),
      });
    }

    // Send notification to the student
    await createNotification({
      userId: requestData.studentId,
      title: action === 'approve' ? 'Enrollment Approved' : 'Enrollment Denied',
      message: action === 'approve' 
        ? `Your enrollment request for "${requestData.courseTitle}" has been approved. You can now access the course.`
        : `Your enrollment request for "${requestData.courseTitle}" has been denied. Please contact support for more information.`,
      type: action === 'approve' ? 'success' : 'error',
      link: action === 'approve' ? `/courses/${requestData.courseId}` : undefined,
    });

    // Send notification to the instructor
    await createNotification({
      userId: requestData.instructorId,
      title: `Enrollment ${action === 'approve' ? 'Approved' : 'Denied'}`,
      message: `${requestData.studentName}'s enrollment request for "${requestData.courseTitle}" has been ${action === 'approve' ? 'approved' : 'denied'}.`,
      type: action === 'approve' ? 'success' : 'warning',
      link: `/formateur/courses/${requestData.courseId}/students`,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Enrollment request ${action}d successfully`,
      status: action === 'approve' ? 'approved' : 'denied'
    });

  } catch (error) {
    console.error('Error processing enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to process enrollment request' },
      { status: 500 }
    );
  }
}
