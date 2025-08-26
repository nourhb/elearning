export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Test API called');
    const { auth, db } = getAdminServices();
    console.log('Firebase services obtained successfully');
    
    // Test basic Firestore access
    const testCollection = db.collection('users');
    const testSnapshot = await testCollection.limit(1).get();
    
    return NextResponse.json({ 
      success: true,
      message: 'Test API is working',
      firestoreConnected: true,
      usersCount: testSnapshot.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Test API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
