import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK...');
    
    const { auth, db } = getAdminServices();
    console.log('Firebase services obtained successfully');
    
    // Test basic Firestore operations
    const testCollection = db.collection('test');
    const testDoc = await testCollection.add({
      test: true,
      timestamp: new Date(),
      message: 'Firebase Admin SDK is working!'
    });
    
    console.log('Test document created:', testDoc.id);
    
    // Clean up - delete the test document
    await testDoc.delete();
    console.log('Test document cleaned up');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Firebase Admin SDK test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
