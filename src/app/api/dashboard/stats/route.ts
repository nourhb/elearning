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

    let stats = {};

    switch (userRole) {
      case 'admin':
        // Admin sees all system statistics
        const [
          totalUsers,
          totalCourses,
          totalEnrollments,
          pendingEnrollmentRequests,
          pendingCourseApprovals,
          totalRevenue
        ] = await Promise.all([
          db.collection('users').count().get(),
          db.collection('courses').count().get(),
          db.collection('progress').count().get(),
          db.collection('enrollmentRequests').where('status', '==', 'pending').count().get(),
          db.collection('courses').where('status', '==', 'pending_approval').count().get(),
          db.collection('payments').get().then(snapshot => {
            return snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
          })
        ]);

        stats = {
          totalUsers: totalUsers.data().count,
          totalCourses: totalCourses.data().count,
          totalEnrollments: totalEnrollments.data().count,
          pendingEnrollmentRequests: pendingEnrollmentRequests.data().count,
          pendingCourseApprovals: pendingCourseApprovals.data().count,
          totalRevenue: totalRevenue,
          recentActivity: await getRecentActivity(db)
        };
        break;

      case 'formateur':
        // Formateur sees their own course statistics
        const [
          myCourses,
          myPublishedCourses,
          myPendingCourses,
          myRejectedCourses,
          myStudents,
          myCourseEnrollments
        ] = await Promise.all([
          db.collection('courses').where('instructorId', '==', userId).count().get(),
          db.collection('courses').where('instructorId', '==', userId).where('status', '==', 'published').count().get(),
          db.collection('courses').where('instructorId', '==', userId).where('status', '==', 'pending_approval').count().get(),
          db.collection('courses').where('instructorId', '==', userId).where('status', '==', 'rejected').count().get(),
          db.collection('progress').where('courseId', 'in', await getMyCourseIds(db, userId)).get().then(snapshot => {
            const uniqueStudents = new Set(snapshot.docs.map(doc => doc.data().userId));
            return uniqueStudents.size;
          }),
          db.collection('progress').where('courseId', 'in', await getMyCourseIds(db, userId)).count().get()
        ]);

        stats = {
          totalCourses: myCourses.data().count,
          publishedCourses: myPublishedCourses.data().count,
          pendingCourses: myPendingCourses.data().count,
          rejectedCourses: myRejectedCourses.data().count,
          totalStudents: myStudents,
          totalEnrollments: myCourseEnrollments.data().count,
          recentActivity: await getFormateurRecentActivity(db, userId)
        };
        break;

      case 'student':
        // Student sees their own learning statistics
        const [
          myEnrollments,
          myCompletedCourses,
          myInProgressCourses,
          myTotalProgress,
          myCertificates
        ] = await Promise.all([
          db.collection('progress').where('userId', '==', userId).count().get(),
          db.collection('progress').where('userId', '==', userId).where('completed', '==', true).count().get(),
          db.collection('progress').where('userId', '==', userId).where('completed', '==', false).count().get(),
          db.collection('progress').where('userId', '==', userId).get().then(snapshot => {
            const enrollments = snapshot.docs.map(doc => doc.data());
            return enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0) / Math.max(enrollments.length, 1);
          }),
          db.collection('certificates').where('userId', '==', userId).count().get()
        ]);

        stats = {
          totalEnrollments: myEnrollments.data().count,
          completedCourses: myCompletedCourses.data().count,
          inProgressCourses: myInProgressCourses.data().count,
          averageProgress: Math.round(myTotalProgress),
          certificates: myCertificates.data().count,
          recentActivity: await getStudentRecentActivity(db, userId)
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
async function getMyCourseIds(db: any, instructorId: string): Promise<string[]> {
  const coursesSnapshot = await db.collection('courses').where('instructorId', '==', instructorId).get();
  return coursesSnapshot.docs.map(doc => doc.id);
}

async function getRecentActivity(db: any) {
  // Get recent system activities (last 10)
  const activities = [];
  
  // Recent course creations
  const recentCourses = await db.collection('courses')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  
  recentCourses.docs.forEach(doc => {
    activities.push({
      type: 'course_created',
      title: `New course: ${doc.data().title}`,
      timestamp: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      data: { courseId: doc.id }
    });
  });

  // Recent enrollments
  const recentEnrollments = await db.collection('progress')
    .orderBy('startedAt', 'desc')
    .limit(5)
    .get();
  
  for (const doc of recentEnrollments.docs) {
    const enrollment = doc.data();
    const courseDoc = await db.collection('courses').doc(enrollment.courseId).get();
    const userDoc = await db.collection('users').doc(enrollment.userId).get();
    
    if (courseDoc.exists && userDoc.exists) {
      activities.push({
        type: 'enrollment',
        title: `${userDoc.data().displayName || userDoc.data().email} enrolled in ${courseDoc.data().title}`,
        timestamp: enrollment.startedAt?.toDate?.() || enrollment.startedAt,
        data: { courseId: enrollment.courseId, userId: enrollment.userId }
      });
    }
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
}

async function getFormateurRecentActivity(db: any, instructorId: string) {
  const activities = [];
  
  // Recent course activities
  const myCourses = await db.collection('courses')
    .where('instructorId', '==', instructorId)
    .orderBy('updatedAt', 'desc')
    .limit(5)
    .get();
  
  myCourses.docs.forEach(doc => {
    const course = doc.data();
    activities.push({
      type: 'course_updated',
      title: `Course "${course.title}" ${course.status}`,
      timestamp: course.updatedAt?.toDate?.() || course.updatedAt,
      data: { courseId: doc.id, status: course.status }
    });
  });

  // Recent student enrollments in my courses
  const courseIds = await getMyCourseIds(db, instructorId);
  if (courseIds.length > 0) {
    const recentEnrollments = await db.collection('progress')
      .where('courseId', 'in', courseIds)
      .orderBy('startedAt', 'desc')
      .limit(5)
      .get();
    
    for (const doc of recentEnrollments.docs) {
      const enrollment = doc.data();
      const courseDoc = await db.collection('courses').doc(enrollment.courseId).get();
      const userDoc = await db.collection('users').doc(enrollment.userId).get();
      
      if (courseDoc.exists && userDoc.exists) {
        activities.push({
          type: 'student_enrollment',
          title: `${userDoc.data().displayName || userDoc.data().email} enrolled in ${courseDoc.data().title}`,
          timestamp: enrollment.startedAt?.toDate?.() || enrollment.startedAt,
          data: { courseId: enrollment.courseId, userId: enrollment.userId }
        });
      }
    }
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
}

async function getStudentRecentActivity(db: any, userId: string) {
  const activities = [];
  
  // Recent course progress
  const recentProgress = await db.collection('progress')
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .limit(10)
    .get();
  
  for (const doc of recentProgress.docs) {
    const progress = doc.data();
    const courseDoc = await db.collection('courses').doc(progress.courseId).get();
    
    if (courseDoc.exists) {
      activities.push({
        type: 'course_progress',
        title: `Progress in ${courseDoc.data().title}: ${progress.progress}%`,
        timestamp: progress.updatedAt?.toDate?.() || progress.updatedAt,
        data: { courseId: progress.courseId, progress: progress.progress }
      });
    }
  }

  // Recent completions
  const recentCompletions = await db.collection('progress')
    .where('userId', '==', userId)
    .where('completed', '==', true)
    .orderBy('completedAt', 'desc')
    .limit(5)
    .get();
  
  for (const doc of recentCompletions.docs) {
    const completion = doc.data();
    const courseDoc = await db.collection('courses').doc(completion.courseId).get();
    
    if (courseDoc.exists) {
      activities.push({
        type: 'course_completed',
        title: `Completed ${courseDoc.data().title}!`,
        timestamp: completion.completedAt?.toDate?.() || completion.completedAt,
        data: { courseId: completion.courseId }
      });
    }
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
}
