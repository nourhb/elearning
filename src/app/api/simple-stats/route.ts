export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple stats API called');
    
    // Return hardcoded values for testing
    const stats = {
      totalUsers: 18,
      totalCourses: 12,
      totalEnrollments: 17,
      pendingEnrollments: 3,
      activeUsers: 15,
      completedCourses: 5
    };
    
    console.log('📊 Simple stats returned:', stats);
    
    return NextResponse.json({ 
      success: true,
      stats,
      message: 'Simple stats API working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple stats API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple stats API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
