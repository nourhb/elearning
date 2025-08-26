export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For static export, return sample data
    const stats = {
      totalUsers: 18,
      activeUsers: 15,
      suspendedUsers: 0,
      newUsersThisMonth: 3,
      totalCourses: 12,
      publishedCourses: 10,
      totalEnrollments: 17,
      completedEnrollments: 5,
      totalPosts: 3,
      pinnedPosts: 1,
      deletedPosts: 0,
      totalComments: 8,
      deletedComments: 0,
      totalMessages: 15,
      deletedMessages: 0,
      averageCompletionRate: 29,
      recentActivity: [
        {
          user: 'John Doe',
          action: 'User created',
          type: 'user',
          time: new Date().toISOString()
        }
      ]
    };

    return NextResponse.json({ 
      stats,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        newUsersThisMonth: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        completedEnrollments: 0,
        totalPosts: 0,
        pinnedPosts: 0,
        deletedPosts: 0,
        totalComments: 0,
        deletedComments: 0,
        totalMessages: 0,
        deletedMessages: 0,
        averageCompletionRate: 0,
        recentActivity: []
      }
    }, { status: 500 });
  }
}
