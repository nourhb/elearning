export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { getEnrollmentRequests, respondToEnrollmentRequest } from '@/lib/services/enrollment-requests';

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

    // Only allow instructors to access this endpoint
    if (userRole !== 'formateur') {
      return NextResponse.json({ error: 'Forbidden - Instructor access required' }, { status: 403 });
    }

    // For static export, return default values
    const status = 'pending';

    const requests = await getEnrollmentRequests(db, decodedToken.uid, 'formateur', status);

    return NextResponse.json({ 
      requests,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment requests', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Only allow instructors to access this endpoint
    if (userRole !== 'formateur') {
      return NextResponse.json({ error: 'Forbidden - Instructor access required' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, responseMessage } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await respondToEnrollmentRequest(db, requestId, status, decodedToken.uid, responseMessage);

    return NextResponse.json({ 
      success: true,
      message: `Enrollment request ${status} successfully`
    });

  } catch (error) {
    console.error('Error responding to enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to respond to enrollment request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
