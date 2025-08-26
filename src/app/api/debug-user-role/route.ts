import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug user role API called');
    const { auth } = getAdminServices();
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('AuthToken')?.value;
    
    if (!authToken) {
      return NextResponse.json({ 
        error: 'No auth token found',
        isAuthenticated: false 
      });
    }

    // Verify the token and get user info
    const decodedToken = await auth.verifyIdToken(authToken);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role || 'student';
    
    // Get user record from Firestore
    const { db } = getAdminServices();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    console.log('User role debug info:', {
      userId,
      tokenRole: userRole,
      firestoreRole: userData?.role,
      displayName: userData?.displayName,
      email: decodedToken.email
    });

    return NextResponse.json({ 
      success: true,
      user: {
        uid: userId,
        email: decodedToken.email,
        tokenRole: userRole,
        firestoreRole: userData?.role,
        displayName: userData?.displayName,
        isAuthenticated: true
      }
    });

  } catch (error) {
    console.error('Debug user role API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get user role info', 
        details: error instanceof Error ? error.message : 'Unknown error',
        isAuthenticated: false
      },
      { status: 500 }
    );
  }
}
