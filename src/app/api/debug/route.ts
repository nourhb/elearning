import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug API called');
    
    // Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
    
    // Test Firebase Admin import
    let firebaseAdminStatus = 'NOT TESTED';
    try {
      const { getAdminServices } = await import('@/lib/firebase-admin');
      const { auth, db } = getAdminServices();
      firebaseAdminStatus = 'SUCCESS';
    } catch (error) {
      firebaseAdminStatus = `FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Debug API is working',
      environment: envVars,
      firebaseAdmin: firebaseAdminStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
