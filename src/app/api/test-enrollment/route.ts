import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { db } = getAdminServices();
    
    // Test 1: Check if there are any admin users
    const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    const adminUsers = adminUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Test 2: Check if there are any enrollment requests
    const enrollmentRequestsSnapshot = await db.collection('enrollmentRequests').get();
    const enrollmentRequests = enrollmentRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Test 3: Check if there are any notifications
    const notificationsSnapshot = await db.collection('notifications').get();
    const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Test 4: Check if there are any courses
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Test 5: Check if there are any progress records
    const progressSnapshot = await db.collection('progress').get();
    const progress = progressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({
      adminUsers: {
        count: adminUsers.length,
        users: adminUsers
      },
      enrollmentRequests: {
        count: enrollmentRequests.length,
        requests: enrollmentRequests
      },
      notifications: {
        count: notifications.length,
        notifications: notifications
      },
      courses: {
        count: courses.length,
        courses: courses
      },
      progress: {
        count: progress.length,
        progress: progress
      }
    });
    
  } catch (error) {
    console.error('Test enrollment API error:', error);
    return NextResponse.json(
      { error: 'Failed to test enrollment system', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db, auth } = getAdminServices();
    const body = await request.json();
    const { action } = body;
    
    if (action === 'create-test-request') {
      // Create a test enrollment request
      const testRequest = {
        studentId: 'test-student-id',
        studentName: 'Test Student',
        studentEmail: 'test@example.com',
        courseId: 'test-course-id',
        courseTitle: 'Test Course',
        instructorId: 'test-instructor-id',
        status: 'pending',
        requestMessage: 'This is a test enrollment request',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await db.collection('enrollmentRequests').add(testRequest);
      
      return NextResponse.json({
        success: true,
        message: 'Test enrollment request created',
        requestId: docRef.id
      });
    }
    
    if (action === 'create-test-admin') {
      // Check if admin users exist
      const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
      
      if (adminUsersSnapshot.empty) {
        // Create a test admin user
        const testAdminUser = {
          uid: 'test-admin-uid',
          email: 'admin@test.com',
          displayName: 'Test Admin',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await db.collection('users').doc('test-admin-uid').set(testAdminUser);
        
        return NextResponse.json({
          success: true,
          message: 'Test admin user created',
          adminUser: testAdminUser
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Admin users already exist',
          count: adminUsersSnapshot.docs.length
        });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Test enrollment POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create test enrollment request', details: error },
      { status: 500 }
    );
  }
}
