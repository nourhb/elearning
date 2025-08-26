export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For static export, return sample data
    const courses = [
      {
        id: 'course-1',
        title: 'Sample Course 1',
        description: 'This is a sample course for static export',
        instructor: 'Sample Instructor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'course-2',
        title: 'Sample Course 2',
        description: 'Another sample course for static export',
        instructor: 'Sample Instructor 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];



    return NextResponse.json({ 
      courses,
      total: courses.length,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
