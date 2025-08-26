export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple users API called');
    
    // Return hardcoded user data
    const users = [
      {
        id: 'user1',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        id: 'user2',
        email: 'instructor@example.com',
        displayName: 'Math Instructor',
        role: 'formateur',
        status: 'active',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        id: 'user3',
        email: 'student1@example.com',
        displayName: 'John Doe',
        role: 'student',
        status: 'active',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        id: 'user4',
        email: 'student2@example.com',
        displayName: 'Jane Smith',
        role: 'student',
        status: 'active',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        id: 'user5',
        email: 'student3@example.com',
        displayName: 'Bob Johnson',
        role: 'student',
        status: 'active',
        createdAt: new Date(),
        lastLogin: new Date()
      }
    ];
    
    // Calculate role distribution
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📊 Simple users API returned ${users.length} users`);
    
    return NextResponse.json({ 
      success: true,
      users,
      roleDistribution,
      message: 'Simple users API working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple users API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple users API failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
