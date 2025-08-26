export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin dashboard TEST API called - static export version');
    
    // For static export, return sample data
    const dashboardData = {
      users: [],
      courses: [],
      progress: [],
      communityPosts: [],
      postComments: [],
      messages: [],
      enrollmentRequests: [],
      stats: {
        totalUsers: 18,
        totalCourses: 12,
        newUsersThisMonth: 3,
        activeUsers: 15,
        suspendedUsers: 0,
        publishedCourses: 10,
        draftCourses: 2,
        totalEnrollments: 17,
        completedEnrollments: 5,
        averageCompletionRate: 29,
        totalPosts: 3,
        totalComments: 8,
        totalMessages: 15,
        pinnedPosts: 1,
        deletedPosts: 0,
        deletedComments: 0,
        deletedMessages: 0,
        pendingEnrollmentRequests: 3,
        approvedEnrollmentRequests: 12,
        deniedEnrollmentRequests: 2
      },
      roleDistribution: {
        admin: 1,
        formateur: 1,
        student: 16
      },
      recentActivity: [
        {
          type: 'user_signup',
          user: 'John Doe',
          action: 'joined the platform',
          time: new Date().toISOString(),
          role: 'student'
        }
      ],
      topPerformingUsers: [],
      success: true
    };



    console.log('Admin dashboard TEST data prepared successfully');
    return NextResponse.json({ 
      ...dashboardData,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching admin dashboard TEST data:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error('Error details:', {
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
