import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { 
  notifyAdminsEnrollmentApproved, 
  notifyAdminsEnrollmentDenied 
} from '@/lib/services/admin-notifications';

export async function POST(request: NextRequest) {
  try {
    console.log('Test enrollment response API called');
    const { db } = getAdminServices();
    
    const body = await request.json();
    const { requestId, status, responseMessage } = body;

    console.log('Request body:', { requestId, status, responseMessage });

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the enrollment request
    const requestRef = db.collection('enrollmentRequests').doc(requestId);
    const requestDoc = await requestRef.get();
    
    console.log('Document exists:', requestDoc.exists);
    
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Enrollment request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    console.log('Request data:', requestData);

    // Update the request
    console.log('Updating enrollment request...');
    await requestRef.update({
      status,
      responseMessage: responseMessage || `Request ${status} by administrator`,
      respondedBy: 'test-admin',
      respondedAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Enrollment request updated successfully');

    // Handle enrollment based on admin decision
    if (status === 'approved') {
      // Create enrollment when approved
      console.log('Creating enrollment for approved request...');
      const progressCollection = db.collection('progress');
      
      await progressCollection.add({
        userId: requestData?.studentId,
        courseId: requestData?.courseId,
        progress: 0,
        completed: false,
        completedLessons: [],
        startedAt: new Date(),
        enrollmentRequestId: requestId,
        status: 'active'
      });
      console.log('Enrollment created successfully');
    } else {
      // For denied requests, we don't create an enrollment
      // The student never had access, so nothing to revoke
      console.log('Enrollment request denied - no enrollment created');
    }

    // Create notification for student
    console.log('Creating notification...');
    const notificationData = {
      userId: requestData?.studentId,
      title: `Enrollment ${status === 'approved' ? 'Approved' : 'Denied'}`,
      message: status === 'approved' 
        ? `Your enrollment in "${requestData?.courseTitle}" has been approved by an administrator.` 
        : `Your enrollment in "${requestData?.courseTitle}" has been denied by an administrator.`,
      type: status === 'approved' ? 'success' : 'warning',
      link: status === 'approved' ? `/courses/${requestData?.courseId}` : '/courses',
      createdAt: new Date(),
      read: false,
    };

    await db.collection('notifications').add(notificationData);
    console.log('Notification created successfully');

    // Send admin notification about enrollment decision
    try {
      if (status === 'approved') {
        await notifyAdminsEnrollmentApproved(requestData, 'test-admin');
      } else {
        await notifyAdminsEnrollmentDenied(requestData, 'test-admin', responseMessage);
      }
      console.log('Admin notification about enrollment decision sent successfully');
    } catch (error) {
      console.error('Failed to send admin notification about enrollment decision:', error);
      // Don't fail the entire operation if notification fails
    }

    return NextResponse.json({ 
      success: true,
      message: `Enrollment request ${status} successfully`,
      requestId,
      status
    });

  } catch (error) {
    console.error('Test enrollment response API error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to enrollment request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
