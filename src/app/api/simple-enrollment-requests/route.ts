export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple enrollment requests API called');
    
    // Return hardcoded enrollment request data
    const requests = [
      {
        id: 'req1',
        userId: 'user1',
        courseId: 'course1',
        status: 'pending',
        requestDate: new Date(),
        studentName: 'John Doe',
        courseTitle: 'titre',
        message: 'I would like to enroll in this course'
      },
      {
        id: 'req2',
        userId: 'user2',
        courseId: 'course2',
        status: 'pending',
        requestDate: new Date(),
        studentName: 'Jane Smith',
        courseTitle: 'math gggggggggg',
        message: 'Please approve my enrollment request'
      },
      {
        id: 'req3',
        userId: 'user3',
        courseId: 'course3',
        status: 'approved',
        requestDate: new Date(),
        studentName: 'Bob Johnson',
        courseTitle: 'Sample Course 3',
        message: 'Enrollment request for advanced course'
      }
    ];
    
    console.log(`📊 Simple enrollment requests API returned ${requests.length} requests`);
    
    return NextResponse.json({ 
      success: true,
      requests,
      message: 'Simple enrollment requests API working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple enrollment requests API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple enrollment requests API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
