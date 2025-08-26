export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

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

    // Sample users data
    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        role: 'student',
        status: 'active',
        createdAt: new Date(),
      },
      {
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        role: 'formateur',
        status: 'active',
        createdAt: new Date(),
      },
      {
        email: 'mike.johnson@example.com',
        displayName: 'Mike Johnson',
        role: 'student',
        status: 'active',
        createdAt: new Date(),
      },
      {
        email: 'sarah.wilson@example.com',
        displayName: 'Sarah Wilson',
        role: 'formateur',
        status: 'active',
        createdAt: new Date(),
      },
      {
        email: 'alex.brown@example.com',
        displayName: 'Alex Brown',
        role: 'student',
        status: 'suspended',
        createdAt: new Date(),
      },
    ];

    // Sample courses data
    const sampleCourses = [
      {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript',
        instructorId: 'sample-instructor-1',
        category: 'Programming',
        level: 'Beginner',
        duration: 120,
        price: 49.99,
        status: 'Published',
        studentCount: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Advanced React Development',
        description: 'Master React hooks, context, and advanced patterns',
        instructorId: 'sample-instructor-2',
        category: 'Programming',
        level: 'Advanced',
        duration: 180,
        price: 79.99,
        status: 'Published',
        studentCount: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Data Science Fundamentals',
        description: 'Introduction to data analysis and machine learning',
        instructorId: 'sample-instructor-1',
        category: 'Data Science',
        level: 'Intermediate',
        duration: 240,
        price: 99.99,
        status: 'Draft',
        studentCount: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create sample users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      try {
        const userRecord = await auth.createUser({
          email: userData.email,
          password: 'password123',
          displayName: userData.displayName,
        });

        await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });

        await db.collection('users').doc(userRecord.uid).set({
          ...userData,
          uid: userRecord.uid,
        });

        createdUsers.push(userRecord.uid);
      } catch (error) {
        console.error(`Failed to create user ${userData.email}:`, error);
      }
    }

    // Create sample courses
    const createdCourses = [];
    for (const courseData of sampleCourses) {
      try {
        const courseRef = await db.collection('courses').add(courseData);
        createdCourses.push(courseRef.id);
      } catch (error) {
        console.error(`Failed to create course ${courseData.title}:`, error);
      }
    }

    // Create sample progress data
    const sampleProgress = [
      {
        userId: createdUsers[0], // John Doe
        courseId: createdCourses[0], // Web Development
        progress: 75,
        completed: false,
        completedLessons: ['lesson1', 'lesson2', 'lesson3'],
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        userId: createdUsers[2], // Mike Johnson
        courseId: createdCourses[0], // Web Development
        progress: 100,
        completed: true,
        completedLessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4'],
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        userId: createdUsers[2], // Mike Johnson
        courseId: createdCourses[1], // React Development
        progress: 45,
        completed: false,
        completedLessons: ['lesson1', 'lesson2'],
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];

    for (const progressData of sampleProgress) {
      try {
        await db.collection('progress').add(progressData);
      } catch (error) {
        console.error('Failed to create progress data:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Sample data created successfully',
      createdUsers: createdUsers.length,
      createdCourses: createdCourses.length,
      createdProgress: sampleProgress.length,
    });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
