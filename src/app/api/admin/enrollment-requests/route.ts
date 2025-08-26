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

    // Only allow admin to access this endpoint
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'denied' | undefined;

    const requests = await getEnrollmentRequests(db, decodedToken.uid, 'admin', status);

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

    // Only allow admin to access this endpoint
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, responseMessage } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    console.log('Attempting to respond to enrollment request:', { requestId, status, respondedBy: decodedToken.uid, responseMessage });
    await respondToEnrollmentRequest(db, requestId, status, decodedToken.uid, responseMessage);
    console.log('Successfully responded to enrollment request');

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
