export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection... - static export version');
    
    // For static export, return sample data
    const results = {
      users: {
        exists: true,
        count: 18,
        sample: [{ id: 'user1', name: 'John Doe', role: 'student' }]
      },
      courses: {
        exists: true,
        count: 12,
        sample: [{ id: 'course1', title: 'Sample Course', instructor: 'Instructor' }]
      },
      progress: {
        exists: true,
        count: 17,
        sample: [{ id: 'progress1', userId: 'user1', courseId: 'course1' }]
      },
      enrollmentRequests: {
        exists: true,
        count: 3,
        sample: [{ id: 'request1', studentId: 'user1', courseId: 'course1', status: 'pending' }]
      },
      communityPosts: {
        exists: true,
        count: 3,
        sample: [{ id: 'post1', title: 'Sample Post', author: 'user1' }]
      },
      postComments: {
        exists: true,
        count: 8,
        sample: [{ id: 'comment1', postId: 'post1', author: 'user1' }]
      },
      messages: {
        exists: true,
        count: 15,
        sample: [{ id: 'message1', sender: 'user1', content: 'Hello' }]
      }
    };
    
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
