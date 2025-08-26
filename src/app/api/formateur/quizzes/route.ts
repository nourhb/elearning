import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { db } = getAdminServices();
    
    // Get all quizzes from the database
    const quizzesSnapshot = await db.collection('quizzes').orderBy('createdAt', 'desc').get();
    
    const quizzes = quizzesSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date();
      const updatedAt = data.updatedAt?.toDate?.() || new Date(data.updatedAt) || new Date();
      
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
