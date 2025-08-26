import { Firestore } from 'firebase-admin/firestore';
import { notifyAllAdmins } from './notifications';
import { getAdminServices } from '@/lib/firebase-admin';
import { createNotification } from './notifications';

/**
 * Admin notification service for all major system events
 */

// Course-related notifications
export async function notifyAdminsNewCourse(courseData: any, createdBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'New Course Created',
    message: `A new course "${courseData.title}" has been created by ${createdBy}`,
    type: 'info',
    link: `/admin/courses/${courseData.id}`,
  });
}

export async function notifyAdminsCourseUpdated(courseData: any, updatedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Course Updated',
    message: `Course "${courseData.title}" has been updated by ${updatedBy}`,
    type: 'info',
    link: `/admin/courses/${courseData.id}`,
  });
}

export async function notifyAdminsCourseDeleted(courseTitle: string, deletedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Course Deleted',
    message: `Course "${courseTitle}" has been deleted by ${deletedBy}`,
    type: 'warning',
    link: '/admin/courses',
  });
}

// User-related notifications
export async function notifyAdminsNewUser(userData: any, createdBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'New User Account Created',
    message: `New ${userData.role} account created for ${userData.displayName} (${userData.email}) by ${createdBy}`,
    type: 'info',
    link: `/admin/users/${userData.uid}`,
  });
}

export async function notifyAdminsUserUpdated(userData: any, updatedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'User Account Updated',
    message: `User account for ${userData.displayName} (${userData.email}) has been updated by ${updatedBy}`,
    type: 'info',
    link: `/admin/users/${userData.uid}`,
  });
}

export async function notifyAdminsUserDeleted(userData: any, deletedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'User Account Deleted',
    message: `User account for ${userData.displayName} (${userData.email}) has been deleted by ${deletedBy}`,
    type: 'warning',
    link: '/admin/users',
  });
}

export async function notifyAdminsUserSuspended(userData: any, suspendedBy: string, reason?: string): Promise<void> {
  await notifyAllAdmins({
    title: 'User Account Suspended',
    message: `User account for ${userData.displayName} (${userData.email}) has been suspended by ${suspendedBy}${reason ? ` - Reason: ${reason}` : ''}`,
    type: 'warning',
    link: `/admin/users/${userData.uid}`,
  });
}

export async function notifyAdminsUserActivated(userData: any, activatedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'User Account Activated',
    message: `User account for ${userData.displayName} (${userData.email}) has been activated by ${activatedBy}`,
    type: 'success',
    link: `/admin/users/${userData.uid}`,
  });
}

// Enrollment-related notifications
export async function notifyAdminsNewEnrollmentRequest(enrollmentData: any): Promise<void> {
  await notifyAllAdmins({
    title: 'New Enrollment Request',
    message: `${enrollmentData.studentName} (${enrollmentData.studentEmail}) has requested to enroll in "${enrollmentData.courseTitle}"`,
    type: 'info',
    link: '/admin/enrollment-requests',
  });
}

export async function notifyAdminsEnrollmentApproved(enrollmentData: any, approvedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Enrollment Approved',
    message: `Enrollment request for ${enrollmentData.studentName} in "${enrollmentData.courseTitle}" has been approved by ${approvedBy}`,
    type: 'success',
    link: '/admin/enrollment-requests',
  });
}

export async function notifyAdminsEnrollmentDenied(enrollmentData: any, deniedBy: string, reason?: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Enrollment Denied',
    message: `Enrollment request for ${enrollmentData.studentName} in "${enrollmentData.courseTitle}" has been denied by ${deniedBy}${reason ? ` - Reason: ${reason}` : ''}`,
    type: 'warning',
    link: '/admin/enrollment-requests',
  });
}

// Content-related notifications
export async function notifyAdminsNewLesson(lessonData: any, courseTitle: string, createdBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'New Lesson Created',
    message: `New lesson "${lessonData.title}" has been added to course "${courseTitle}" by ${createdBy}`,
    type: 'info',
    link: `/admin/courses/${lessonData.courseId}/lessons`,
  });
}

export async function notifyAdminsNewQuiz(quizData: any, courseTitle: string, createdBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'New Quiz Created',
    message: `New quiz "${quizData.title}" has been added to course "${courseTitle}" by ${createdBy}`,
    type: 'info',
    link: `/admin/courses/${quizData.courseId}/quizzes`,
  });
}

export async function notifyAdminsContentUpdated(contentData: any, contentType: string, courseTitle: string, updatedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: `${contentType} Updated`,
    message: `${contentType} "${contentData.title}" in course "${courseTitle}" has been updated by ${updatedBy}`,
    type: 'info',
    link: `/admin/courses/${contentData.courseId}`,
  });
}

// Community-related notifications
export async function notifyAdminsNewPost(postData: any, authorName: string): Promise<void> {
  await notifyAllAdmins({
    title: 'New Community Post',
    message: `New community post "${postData.title}" has been created by ${authorName}`,
    type: 'info',
    link: '/admin/community',
  });
}

export async function notifyAdminsPostReported(postData: any, reportedBy: string, reason: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Community Post Reported',
    message: `Community post "${postData.title}" has been reported by ${reportedBy} - Reason: ${reason}`,
    type: 'warning',
    link: '/admin/community',
  });
}

export async function notifyAdminsNewComment(commentData: any, postTitle: string, authorName: string): Promise<void> {
  await notifyAllAdmins({
    title: 'New Comment on Post',
    message: `New comment has been added to post "${postTitle}" by ${authorName}`,
    type: 'info',
    link: '/admin/community',
  });
}

// System-related notifications
export async function notifyAdminsSystemError(error: string, context: string): Promise<void> {
  await notifyAllAdmins({
    title: 'System Error Detected',
    message: `System error in ${context}: ${error}`,
    type: 'error',
    link: '/admin/system-logs',
  });
}

export async function notifyAdminsSystemMaintenance(maintenanceType: string, scheduledBy: string, duration?: string): Promise<void> {
  await notifyAllAdmins({
    title: 'System Maintenance Scheduled',
    message: `${maintenanceType} maintenance has been scheduled by ${scheduledBy}${duration ? ` for ${duration}` : ''}`,
    type: 'warning',
    link: '/admin/system',
  });
}

export async function notifyAdminsBackupCompleted(backupType: string, completedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'System Backup Completed',
    message: `${backupType} backup has been completed by ${completedBy}`,
    type: 'success',
    link: '/admin/system',
  });
}

// Analytics and performance notifications
export async function notifyAdminsHighTraffic(metric: string, value: number, threshold: number): Promise<void> {
  await notifyAllAdmins({
    title: 'High Traffic Alert',
    message: `${metric} has reached ${value} (threshold: ${threshold})`,
    type: 'warning',
    link: '/admin/analytics',
  });
}

export async function notifyAdminsLowPerformance(metric: string, value: number, threshold: number): Promise<void> {
  await notifyAllAdmins({
    title: 'Performance Alert',
    message: `${metric} has dropped to ${value} (below threshold: ${threshold})`,
    type: 'warning',
    link: '/admin/analytics',
  });
}

// Security-related notifications
export async function notifyAdminsFailedLoginAttempt(userEmail: string, ipAddress: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Failed Login Attempt',
    message: `Multiple failed login attempts detected for ${userEmail} from IP ${ipAddress}`,
    type: 'warning',
    link: '/admin/security',
  });
}

export async function notifyAdminsSuspiciousActivity(activity: string, userEmail: string, details: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Suspicious Activity Detected',
    message: `Suspicious activity detected: ${activity} by ${userEmail} - ${details}`,
    type: 'error',
    link: '/admin/security',
  });
}

// Course completion notifications
export async function notifyAdminsCourseCompleted(userData: any, courseData: any, completionDate: Date): Promise<void> {
  await notifyAllAdmins({
    title: 'Course Completion',
    message: `${userData.displayName} has completed the course "${courseData.title}"`,
    type: 'success',
    link: `/admin/courses/${courseData.id}/progress`,
  });
}

// Payment and subscription notifications
export async function notifyAdminsNewPayment(paymentData: any, userData: any): Promise<void> {
  await notifyAllAdmins({
    title: 'New Payment Received',
    message: `Payment of ${paymentData.amount} received from ${userData.displayName} for ${paymentData.description}`,
    type: 'success',
    link: '/admin/payments',
  });
}

export async function notifyAdminsPaymentFailed(paymentData: any, userData: any, reason: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Payment Failed',
    message: `Payment of ${paymentData.amount} from ${userData.displayName} failed - Reason: ${reason}`,
    type: 'error',
    link: '/admin/payments',
  });
}

// Bulk operations notifications
export async function notifyAdminsBulkOperation(operation: string, count: number, performedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Bulk Operation Completed',
    message: `${operation} completed on ${count} items by ${performedBy}`,
    type: 'info',
    link: '/admin/dashboard',
  });
}

// Data export/import notifications
export async function notifyAdminsDataExport(exportType: string, recordCount: number, exportedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Data Export Completed',
    message: `${exportType} export completed with ${recordCount} records by ${exportedBy}`,
    type: 'success',
    link: '/admin/data',
  });
}

export async function notifyAdminsDataImport(importType: string, recordCount: number, importedBy: string): Promise<void> {
  await notifyAllAdmins({
    title: 'Data Import Completed',
    message: `${importType} import completed with ${recordCount} records by ${importedBy}`,
    type: 'success',
    link: '/admin/data',
  });
}

// Formateur course approval notifications
export async function notifyFormateurCourseApproved(course: any, adminName: string) {
  // Get formateur user data
  const { db } = getAdminServices();
  const formateurDoc = await db.collection('users').doc(course.instructorId).get();
  const formateurData = formateurDoc.data();
  
  if (formateurData) {
    await createNotification({
      userId: course.instructorId,
      title: 'Course Approved!',
      message: `Your course "${course.title}" has been approved by ${adminName} and is now live for students.`,
      type: 'course_approval',
      data: { courseId: course.id, status: 'approved' }
    });
  }
}

export async function notifyFormateurCourseRejected(course: any, adminName: string, reason?: string) {
  // Get formateur user data
  const { db } = getAdminServices();
  const formateurDoc = await db.collection('users').doc(course.instructorId).get();
  const formateurData = formateurDoc.data();
  
  if (formateurData) {
    await createNotification({
      userId: course.instructorId,
      title: 'Course Review Required',
      message: `Your course "${course.title}" needs revisions. ${reason ? `Reason: ${reason}` : 'Please review and resubmit.'}`,
      type: 'course_rejection',
      data: { courseId: course.id, status: 'rejected', reason }
    });
  }
}

// Community notifications (chat and posts)
export async function notifyAllUsersNewPost(post: any, author: any) {
  const { db } = getAdminServices();
  const usersSnapshot = await db.collection('users').get();
  
  const notifications = usersSnapshot.docs.map(doc => ({
    userId: doc.id,
    title: 'New Community Post',
    message: `${author.displayName || author.email} shared: "${post.title}"`,
    type: 'community_post',
    data: { postId: post.id, authorId: author.uid }
  }));
  
  // Create notifications in batches
  const batch = db.batch();
  notifications.forEach(notification => {
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, {
      ...notification,
      createdAt: new Date(),
      read: false
    });
  });
  
  await batch.commit();
}

export async function notifyAllUsersNewChatMessage(message: any, sender: any, courseId: string) {
  const { db } = getAdminServices();
  
  // Get all users enrolled in this course
  const enrollmentsSnapshot = await db.collection('progress')
    .where('courseId', '==', courseId)
    .get();
  
  const userIds = enrollmentsSnapshot.docs.map(doc => doc.data().userId);
  
  // Also include the course instructor
  const courseDoc = await db.collection('courses').doc(courseId).get();
  const courseData = courseDoc.data();
  if (courseData?.instructorId && !userIds.includes(courseData.instructorId)) {
    userIds.push(courseData.instructorId);
  }
  
  const notifications = userIds
    .filter(userId => userId !== sender.uid) // Don't notify the sender
    .map(userId => ({
      userId,
      title: 'New Chat Message',
      message: `${sender.displayName || sender.email}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      type: 'chat_message',
      data: { messageId: message.id, courseId, senderId: sender.uid }
    }));
  
  // Create notifications in batches
  const batch = db.batch();
  notifications.forEach(notification => {
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, {
      ...notification,
      createdAt: new Date(),
      read: false
    });
  });
  
  await batch.commit();
}
