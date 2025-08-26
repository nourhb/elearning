import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getAdminServices();
    const quizId = params.id;
    
    // Get quiz attempts for this quiz
    const attemptsSnapshot = await db.collection('quizAttempts')
      .where('quizId', '==', quizId)
      .get();
    
    if (attemptsSnapshot.empty) {
      return NextResponse.json({
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
        questionStats: [],
      });
    }

    const attempts = attemptsSnapshot.docs.map(doc => doc.data());
    
    // Calculate stats
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(attempt => attempt.passed).length;
    const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;
    
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0);
    const averageTimeSpent = totalAttempts > 0 ? totalTimeSpent / totalAttempts : 0;

    return NextResponse.json({
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      averageTimeSpent: Math.round(averageTimeSpent),
      questionStats: [], // TODO: Implement question-level stats
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz stats' },
      { status: 500 }
    );
  }
}
