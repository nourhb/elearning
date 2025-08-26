import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Test dashboard API called');
    const { db } = getAdminServices();

    // Simple approach - fetch basic data
    const usersSnapshot = await db.collection('users').get();
    const coursesSnapshot = await db.collection('courses').get();
    const progressSnapshot = await db.collection('progress').get();
    const enrollmentRequestsSnapshot = await db.collection('enrollmentRequests').get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        // Ensure proper date formatting
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      };
    });

    const courses = coursesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure proper date formatting
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      };
    });

    const progress = progressSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure proper date formatting
        startedAt: data.startedAt?.toDate?.() || new Date(data.startedAt || Date.now()),
        completedAt: data.completedAt?.toDate?.() || new Date(data.completedAt || Date.now()),
      };
    });

    const enrollmentRequests = enrollmentRequestsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure proper date formatting
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
        respondedAt: data.respondedAt?.toDate?.() || new Date(data.respondedAt || Date.now()),
      };
    });

    const stats = {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalEnrollments: progress.length,
      completedEnrollments: progress.filter(p => p.completed).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      instructorUsers: users.filter(u => u.role === 'formateur').length,
      studentUsers: users.filter(u => u.role === 'student').length,
    };

    return NextResponse.json({ 
      stats,
      users: users.slice(0, 5), // First 5 users
      courses: courses.slice(0, 5), // First 5 courses
      enrollmentRequests: enrollmentRequests, // All enrollment requests
      success: true 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
