export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For static export, return sample data
    const courses = [
      {
        id: 'course1',
        title: 'Sample Course 1',
        description: 'This is a sample course for static export',
        instructorName: 'Sample Instructor',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'course2',
        title: 'Sample Course 2',
        description: 'Another sample course for static export',
        instructorName: 'Sample Instructor 2',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json({ 
        error: 'Database operation timed out. Please try again.',
        courses: [] // Return empty array instead of error
      }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      courses: [] // Return empty array instead of error
    }, { status: 500 });
  }
}
