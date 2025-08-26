export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test dashboard API called - static export version');
    
    // For static export, return sample data
    const stats = {
      totalUsers: 18,
      totalCourses: 12,
      totalEnrollments: 17,
      completedEnrollments: 5,
      adminUsers: 1,
      instructorUsers: 1,
      studentUsers: 16,
    };

    const users = [];
    const courses = [];
    const progress = [];
    const enrollmentRequests = [];

    return NextResponse.json({ 
      stats,
      users: users.slice(0, 5), // First 5 users
      courses: courses.slice(0, 5), // First 5 courses
      enrollmentRequests: enrollmentRequests, // All enrollment requests
      success: true 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
