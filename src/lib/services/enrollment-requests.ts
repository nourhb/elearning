import { Firestore } from 'firebase-admin/firestore';
import type { EnrollmentRequest } from '@/lib/types';
import { createNotification, notifyAllAdmins } from './notifications';
import { sendEnrollmentRequestEmail, sendEnrollmentApprovedEmail, sendEnrollmentDeniedEmail } from './email';
import { 
  notifyAdminsNewEnrollmentRequest, 
  notifyAdminsEnrollmentApproved, 
  notifyAdminsEnrollmentDenied 
} from './admin-notifications';

/**
 * Create an enrollment request
 */
export async function createEnrollmentRequest(
  db: Firestore,
  studentId: string,
  studentName: string,
  studentEmail: string,
  courseId: string,
  courseTitle: string,
  instructorId: string,
  requestMessage?: string
): Promise<EnrollmentRequest> {
  const requestsCollection = db.collection('enrollmentRequests');
  
  const request: Omit<EnrollmentRequest, 'id'> = {
    studentId,
    studentName,
    studentEmail,
    courseId,
    courseTitle,
    instructorId,
    status: 'pending',
    requestMessage: requestMessage || null, // Convert undefined to null for Firestore
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await requestsCollection.add(request);
  const newRequest = { ...request, id: docRef.id } as EnrollmentRequest;

  // Send notifications to admin and instructor
  try {
    console.log('Sending enrollment request notifications for:', newRequest.id);
    await sendEnrollmentRequestNotifications(newRequest);
    
    // Send admin notification using new service
    await notifyAdminsNewEnrollmentRequest(newRequest);
    
    console.log('Enrollment request notifications sent successfully');
  } catch (error) {
    console.error('Failed to send enrollment request notifications:', error);
    // Don't fail the entire enrollment request if notifications fail
  }

  return newRequest;
}

/**
 * Get enrollment requests for a user (student, instructor, or admin)
 */
export async function getEnrollmentRequests(
  db: Firestore,
  userId: string,
  userRole: string,
  status?: 'pending' | 'approved' | 'denied'
): Promise<EnrollmentRequest[]> {
  const requestsCollection = db.collection('enrollmentRequests');
  
  let q = requestsCollection.orderBy('createdAt', 'desc');
  
  if (userRole === 'student') {
    // Students can see their own requests
    q = q.where('studentId', '==', userId);
  } else if (userRole === 'formateur') {
    // Instructors can see requests for their courses
    q = q.where('instructorId', '==', userId);
  } else if (userRole === 'admin') {
    // Admins can see all requests
    q = q;
  }

  if (status) {
    q = q.where('status', '==', status);
  }

  const snapshot = await q.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      respondedAt: data.respondedAt?.toDate?.() || data.respondedAt || null,
    } as EnrollmentRequest;
  });
}

/**
 * Approve or deny an enrollment request
 */
export async function respondToEnrollmentRequest(
  db: Firestore,
  requestId: string,
  status: 'approved' | 'denied',
  respondedBy: string,
  responseMessage?: string
): Promise<void> {
  console.log('respondToEnrollmentRequest called with:', { requestId, status, respondedBy, responseMessage });
  
  const requestRef = db.collection('enrollmentRequests').doc(requestId);
  console.log('Fetching enrollment request document...');
  const requestDoc = await requestRef.get();
  console.log('Document exists:', requestDoc.exists);
  
  if (!requestDoc.exists) {
    throw new Error('Enrollment request not found');
  }

  const requestData = requestDoc.data();
  const request = {
    id: requestDoc.id,
    ...requestData,
    createdAt: requestData?.createdAt?.toDate?.() || requestData?.createdAt || new Date(),
    updatedAt: requestData?.updatedAt?.toDate?.() || requestData?.updatedAt || new Date(),
    respondedAt: requestData?.respondedAt?.toDate?.() || requestData?.respondedAt || null,
  } as EnrollmentRequest;
  
  // Update the request
  console.log('Updating enrollment request document...');
  await requestRef.update({
    status,
    responseMessage,
    respondedBy,
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
      userId: request.studentId,
      courseId: request.courseId,
      progress: 0,
      completed: false,
      completedLessons: [],
      startedAt: new Date(),
      enrollmentRequestId: request.id,
      status: 'active'
    });
    console.log('Enrollment created successfully');
  } else {
    // For denied requests, we don't create an enrollment
    // The student never had access, so nothing to revoke
    console.log('Enrollment request denied - no enrollment created');
  }

  // Send notification to student
  console.log('Sending notification to student...');
  try {
    await sendEnrollmentResponseNotification(db, request, status, responseMessage);
    console.log('Student notification sent successfully');
  } catch (error) {
    console.error('Failed to send student notification:', error);
    // Don't fail the entire operation if notification fails
  }

  // Send admin notification about enrollment decision
  try {
    if (status === 'approved') {
      await notifyAdminsEnrollmentApproved(request, 'admin'); // TODO: Get actual admin name
    } else {
      await notifyAdminsEnrollmentDenied(request, 'admin', responseMessage); // TODO: Get actual admin name
    }
    console.log('Admin notification about enrollment decision sent successfully');
  } catch (error) {
    console.error('Failed to send admin notification about enrollment decision:', error);
    // Don't fail the entire operation if notification fails
  }
}

/**
 * Create enrollment from approved request
 */
async function createEnrollmentFromRequest(db: Firestore, request: EnrollmentRequest): Promise<void> {
  const progressCollection = db.collection('progress');
  
  await progressCollection.add({
    userId: request.studentId,
    courseId: request.courseId,
    progress: 0,
    completed: false,
    completedLessons: [],
    startedAt: new Date(),
  });
}

/**
 * Send notifications for new enrollment requests
 */
async function sendEnrollmentRequestNotifications(request: EnrollmentRequest): Promise<void> {
  console.log('Starting to send enrollment request notifications...');
  
  try {
    // Send notification to all admins
    console.log('Sending notification to all admins...');
    await notifyAllAdmins({
      title: 'New Enrollment Request',
      message: `${request.studentName} has requested to enroll in "${request.courseTitle}"`,
      type: 'info',
      link: `/admin/enrollment-requests`,
    });
    console.log('Admin notifications sent successfully');
  } catch (error) {
    console.error('Failed to send admin notifications:', error);
  }

  try {
    // Send notification to course instructor
    console.log('Sending notification to instructor:', request.instructorId);
    await createNotification({
      userId: request.instructorId,
      title: 'New Enrollment Request',
      message: `${request.studentName} has requested to enroll in your course "${request.courseTitle}"`,
      type: 'info',
      link: `/formateur/enrollment-requests`,
    });
    console.log('Instructor notification sent successfully');
  } catch (error) {
    console.error('Failed to send instructor notification:', error);
  }

  // Send email to admins (you can get admin emails from the database)
  try {
    // For now, we'll send to a default admin email
    // In a real implementation, you'd fetch admin emails from the database
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduverse.com';
    console.log('Sending email to admin:', adminEmail);
    await sendEnrollmentRequestEmail(
      adminEmail,
      request.studentName,
      request.studentEmail,
      request.courseTitle
    );
    console.log('Admin email sent successfully');
  } catch (error) {
    console.error('Failed to send admin email notification:', error);
  }
}

/**
 * Send notification for enrollment response
 */
async function sendEnrollmentResponseNotification(
  db: Firestore, 
  request: EnrollmentRequest, 
  status: 'approved' | 'denied',
  responseMessage?: string
): Promise<void> {
  console.log('Creating in-app notification for student:', request.studentId);
  try {
    // Send notification to student
    await createNotification({
      userId: request.studentId,
      title: `Enrollment ${status === 'approved' ? 'Approved' : 'Denied'}`,
      message: status === 'approved' 
        ? `Your enrollment in "${request.courseTitle}" has been approved by an administrator.` 
        : `Your enrollment in "${request.courseTitle}" has been denied by an administrator.`,
      type: status === 'approved' ? 'success' : 'warning',
      link: status === 'approved' ? `/courses/${request.courseId}` : '/courses',
    });
    console.log('In-app notification created successfully');
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
  }

  // Send email to student
  console.log('Sending email notification to student:', request.studentEmail);
  try {
    if (status === 'approved') {
      console.log('Sending approval email...');
      await sendEnrollmentApprovedEmail(
        request.studentEmail,
        request.studentName,
        request.courseTitle,
        `${process.env.NEXT_PUBLIC_APP_URL}/courses/${request.courseId}`
      );
      console.log('Approval email sent successfully');
    } else {
      console.log('Sending denial email...');
      await sendEnrollmentDeniedEmail(
        request.studentEmail,
        request.studentName,
        request.courseTitle
      );
      console.log('Denial email sent successfully');
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't fail the entire operation if email fails
  }
}
