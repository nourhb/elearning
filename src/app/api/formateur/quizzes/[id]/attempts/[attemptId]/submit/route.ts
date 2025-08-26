export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  return [
    { id: 'default', attemptId: 'default' }
  ];
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; attemptId: string } }
) {
  try {
    const { db } = getAdminServices();
    const { id: quizId, attemptId } = params;
    const { answers, totalTimeSpent } = await request.json();
    
    // Get the quiz to calculate scores
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    if (!quizDoc.exists) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    const quizData = quizDoc.data();
    const questions = quizData?.questions || [];
    
    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    const processedAnswers = answers.map((answer: any) => {
      const question = questions.find((q: any) => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false, points: 0 };
      
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      
      if (isCorrect) correctAnswers++;
      totalPoints += question.points;
      
      return {
        ...answer,
        isCorrect,
        points,
      };
    });
    
    const percentage = totalPoints > 0 ? (correctAnswers / questions.length) * 100 : 0;
    const passed = percentage >= (quizData?.passingScore || 70);
    
    // Update the attempt
    const attemptRef = db.collection('quizAttempts').doc(attemptId);
    await attemptRef.update({
      answers: processedAnswers,
      score: correctAnswers,
      percentage,
      passed,
      timeSpent: totalTimeSpent,
      completedAt: new Date(),
    });
    
    // Get the updated attempt
    const updatedAttemptDoc = await attemptRef.get();
    const attemptData = updatedAttemptDoc.data();
    
    const result = {
      id: attemptId,
      quizId,
      score: correctAnswers,
      percentage,
      passed,
      timeSpent: totalTimeSpent,
      completedAt: attemptData?.completedAt?.toDate?.() || new Date(),
      attemptNumber: attemptData?.attemptNumber || 1,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz attempt' },
      { status: 500 }
    );
  }
}
