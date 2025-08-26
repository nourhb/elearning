export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug user role API called - static export version');
    
    // For static export, return sample data
    return NextResponse.json({ 
      success: true,
      user: {
        uid: 'sample-user-id',
        email: 'user@example.com',
        tokenRole: 'student',
        firestoreRole: 'student',
        displayName: 'Sample User',
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
