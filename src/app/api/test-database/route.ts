import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    const { db } = getAdminServices();
    
    // Test basic collections
    const collections = ['users', 'courses', 'progress', 'enrollmentRequests', 'communityPosts', 'postComments', 'messages'];
    const results: any = {};
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        results[collectionName] = {
          exists: true,
          count: snapshot.docs.length,
          sample: snapshot.docs.slice(0, 2).map(doc => ({ id: doc.id, ...doc.data() }))
        };
      } catch (error) {
        results[collectionName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      database: 'connected',
      collections: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
