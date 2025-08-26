export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin dashboard API called - static export version');
    
    // For static export, return sample data
    const dashboardData = {
      stats: {
        totalUsers: 18,
        totalCourses: 12,
        totalEnrollments: 17,
        pendingEnrollments: 3,
        activeUsers: 15,
        completedCourses: 5,
        totalCommunityPosts: 3,
        totalMessages: 15
      },
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          message: 'New user registered',
          timestamp: new Date().toISOString(),
          user: 'John Doe'
        },
        {
          id: '2',
          type: 'course_created',
          message: 'New course created',
          timestamp: new Date().toISOString(),
          course: 'Sample Course'
        }
      ],
      users: [],
      courses: [],
      enrollmentRequests: []
    };

    return NextResponse.json({ 
      ...dashboardData,
      success: true,
      timestamp: new Date().toISOString()
    });

    // New enrollment requests
    const recentEnrollmentRequests = enrollmentRequests
      .filter(r => {
        try {
          return new Date(r.createdAt) >= lastWeek;
        } catch (error) {
          console.warn('Error filtering enrollment request:', r.id, error);
          return false;
        }
      })
      .map(r => ({
        type: 'enrollment_request',
        user: r.studentName || 'Unknown Student', // Added default
        action: `requested enrollment in "${r.courseTitle || 'Unknown Course'}"`, // Added default
        time: r.createdAt,
        role: 'student',
      }));

    // Combine all activities and sort by time
    recentActivity.push(...recentUsers, ...recentPosts, ...recentComments, ...recentCourses, ...recentEnrollmentRequests);
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
    recentActivity.splice(10); // Keep only the 10 most recent

    // Calculate top performing users (students with most completed courses)
    console.log('Calculating top performing users...');
    const studentProgress = progress
      .filter(p => p.completed)
      .reduce((acc, p) => {
        acc[p.userId] = (acc[p.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topPerformingUsers = Object.entries(studentProgress)
      .map(([userId, completedCount]) => {
        const user = users.find(u => u.uid === userId);
        return user ? {
          ...user,
          coursesCompleted: completedCount,
          averageScore: Math.floor(Math.random() * 20) + 80, // Placeholder
          badges: Math.floor(completedCount / 2), // Placeholder
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
      .slice(0, 5);

    console.log('Admin dashboard data prepared successfully');
    return NextResponse.json({ 
      users,
      courses,
      progress,
      communityPosts,
      postComments,
      messages,
      enrollmentRequests,
      stats,
      roleDistribution,
      recentActivity,
      topPerformingUsers,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    
    // Provide more detailed error information for debugging
    let errorMessage = 'Unknown error';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    // Log additional context
    console.error('Error details:', {
      message: errorMessage,
      stack: errorDetails,
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
