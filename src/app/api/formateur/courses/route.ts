import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { notifyAdminsNewCourse } from '@/lib/services/admin-notifications';

export async function GET(request: NextRequest) {
  try {
    const { db } = getAdminServices();
    
    // Get all courses from the database
    const coursesSnapshot = await db.collection('courses').orderBy('createdAt', 'desc').get();
    
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

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

    // Only allow formateur and admin to access this endpoint
    if (userRole !== 'formateur' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const instructorId = formData.get('instructorId') as string;
    const category = formData.get('category') as string;
    const level = formData.get('level') as string;
    const duration = parseInt(formData.get('duration') as string);
    const price = parseFloat(formData.get('price') as string);
    const imageUrl = formData.get('imageUrl') as string;
    const status = formData.get('status') as string;

    if (!title || !description || !instructorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const courseData = {
      title,
      description,
      instructorId,
      category,
      level,
      duration,
      price,
      imageUrl,
      status: 'pending_approval', // All new courses require admin approval
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('courses').add(courseData);

    // Send admin notification about new course
    try {
      const courseWithId = { ...courseData, id: docRef.id };
      await notifyAdminsNewCourse(courseWithId, decodedToken.displayName || 'Unknown Instructor');
    } catch (error) {
      console.error('Failed to send admin notification for new course:', error);
      // Don't fail the course creation if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      courseId: docRef.id,
      message: 'Course created successfully' 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


