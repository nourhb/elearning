export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple courses API called');
    
    // Return hardcoded course data based on what we know exists
    const courses = [
      {
        id: 'course1',
        title: 'titre',
        description: 'Course description',
        instructor: 'Instructor Name',
        category: 'General',
        level: 'Beginner',
        duration: '10 hours',
        enrolledStudents: 5,
        rating: 4.5,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'course2',
        title: 'math gggggggggg',
        description: 'Mathematics course',
        instructor: 'Math Instructor',
        category: 'Mathematics',
        level: 'Intermediate',
        duration: '15 hours',
        enrolledStudents: 8,
        rating: 4.2,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'course3',
        title: 'Sample Course 3',
        description: 'Another sample course',
        instructor: 'Sample Instructor',
        category: 'Technology',
        level: 'Advanced',
        duration: '20 hours',
        enrolledStudents: 12,
        rating: 4.8,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log(`📊 Simple courses API returned ${courses.length} courses`);
    
    return NextResponse.json({ 
      success: true,
      courses,
      message: 'Simple courses API working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple courses API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple courses API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
