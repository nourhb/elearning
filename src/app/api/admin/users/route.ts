export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For static export, return sample data
    const users = [
      {
        uid: 'user1',
        displayName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        uid: 'user2',
        displayName: 'Instructor User',
        email: 'instructor@example.com',
        role: 'formateur',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        uid: 'user3',
        displayName: 'Student User',
        email: 'student@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json({ 
      users,
      total: users.length,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
