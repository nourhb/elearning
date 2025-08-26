export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getAdminServices();
    const quizId = params.id;
    // For static export, return default values
    const userId = 'default-user-id';
    
    // Get quiz attempts for this user and quiz
    const attemptsSnapshot = await db.collection('quizAttempts')
      .where('quizId', '==', quizId)
      .where('userId', '==', userId)
      .get();
    
    const attempts = attemptsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startedAt: data.startedAt?.toDate?.() || new Date(data.startedAt),
        completedAt: data.completedAt?.toDate?.() || new Date(data.completedAt),
      };
    });

    return NextResponse.json({ attempts });
  } catch (error: any) {
    console.error('Error fetching quiz attempts:', error);
    
    // If it's a collection doesn't exist error, return empty array
    if (error.code === 'not-found' || error.message?.includes('collection')) {
      return NextResponse.json({ attempts: [] });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch quiz attempts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getAdminServices();
    const quizId = params.id;
    const { userId, courseId } = await request.json();
    
    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'User ID and Course ID are required' },
        { status: 400 }
      );
    }
    
    // Get existing attempts to determine attempt number
    const existingAttemptsSnapshot = await db.collection('quizAttempts')
      .where('quizId', '==', quizId)
      .where('userId', '==', userId)
      .get();
    
    const attemptNumber = existingAttemptsSnapshot.size + 1;
    
    // Create new attempt
    const attemptData = {
      quizId,
      userId,
      courseId,
      attemptNumber,
      startedAt: new Date(),
      answers: [],
      score: 0,
      percentage: 0,
      passed: false,
      timeSpent: 0,
    };
    
    const attemptRef = await db.collection('quizAttempts').add(attemptData);
    
    return NextResponse.json({ 
      attemptId: attemptRef.id,
      attemptNumber 
    });
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz attempt' },
      { status: 500 }
    );
  }
}
