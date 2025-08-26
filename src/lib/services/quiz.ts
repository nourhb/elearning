import { collection, getDocs, query, where, orderBy, limit, Timestamp, Firestore, DocumentData, FirestoreDataConverter, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Quiz, QuizQuestion, QuizAttempt, QuizStats } from '@/lib/types';

const quizConverter: FirestoreDataConverter<Quiz> = {
    toFirestore: (quiz: Quiz): DocumentData => {
        const data: any = { ...quiz };
        if (quiz.createdAt) {
            data.createdAt = Timestamp.fromDate(quiz.createdAt);
        }
        if (quiz.updatedAt) {
            data.updatedAt = Timestamp.fromDate(quiz.updatedAt);
        }
        delete data.id;
        return data;
    },
    fromFirestore: (snapshot, options): Quiz => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            title: data.title,
            description: data.description,
            courseId: data.courseId,
            moduleId: data.moduleId,
            questions: data.questions || [],
            timeLimit: data.timeLimit,
            passingScore: data.passingScore,
            maxAttempts: data.maxAttempts,
            isActive: data.isActive,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
            createdBy: data.createdBy,
        } as Quiz;
    }
};

const quizAttemptConverter: FirestoreDataConverter<QuizAttempt> = {
    toFirestore: (attempt: QuizAttempt): DocumentData => {
        const data: any = { ...attempt };
        if (attempt.startedAt) {
            data.startedAt = Timestamp.fromDate(attempt.startedAt);
        }
        if (attempt.completedAt) {
            data.completedAt = Timestamp.fromDate(attempt.completedAt);
        }
        delete data.id;
        return data;
    },
    fromFirestore: (snapshot, options): QuizAttempt => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            quizId: data.quizId,
            userId: data.userId,
            courseId: data.courseId,
            answers: data.answers || [],
            score: data.score,
            percentage: data.percentage,
            passed: data.passed,
            timeSpent: data.timeSpent,
            startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : new Date(data.startedAt),
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : new Date(data.completedAt),
            attemptNumber: data.attemptNumber,
        } as QuizAttempt;
    }
};

/**
 * Creates a new quiz
 */
export async function createQuiz(db: Firestore, quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const quizData = {
            ...quiz,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        const quizRef = await addDoc(collection(db, 'quizzes').withConverter(quizConverter), quizData);
        return quizRef.id;
    } catch (error) {
        console.error('Error creating quiz:', error);
        throw new Error('Failed to create quiz');
    }
}

/**
 * Gets all quizzes for a course
 */
export async function getQuizzesForCourse(db: Firestore, courseId: string): Promise<Quiz[]> {
    try {
        const quizzesCollection = collection(db, 'quizzes');
        const q = query(quizzesCollection, where('courseId', '==', courseId), where('isActive', '==', true), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error fetching quizzes for course:', error);
        return [];
    }
}

/**
 * Gets all quizzes (for instructors)
 */
export async function getAllQuizzes(db: Firestore): Promise<Quiz[]> {
    try {
        const quizzesCollection = collection(db, 'quizzes');
        const querySnapshot = await getDocs(query(quizzesCollection, orderBy('createdAt', 'desc')));
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error fetching all quizzes:', error);
        return [];
    }
}

/**
 * Gets a specific quiz by ID
 */
export async function getQuizById(db: Firestore, quizId: string): Promise<Quiz | null> {
    try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId).withConverter(quizConverter));
        if (quizDoc.exists) {
            return quizDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching quiz:', error);
        return null;
    }
}

/**
 * Gets quiz attempts for a user
 */
export async function getQuizAttemptsForUser(db: Firestore, userId: string, quizId?: string): Promise<QuizAttempt[]> {
    try {
        const attemptsCollection = collection(db, 'quizAttempts');
        let q;
        
        if (quizId) {
            q = query(attemptsCollection, where('userId', '==', userId), where('quizId', '==', quizId), orderBy('startedAt', 'desc'));
        } else {
            q = query(attemptsCollection, where('userId', '==', userId), orderBy('startedAt', 'desc'));
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error fetching quiz attempts:', error);
        return [];
    }
}

/**
 * Starts a new quiz attempt
 */
export async function startQuizAttempt(db: Firestore, quizId: string, userId: string, courseId: string): Promise<string> {
    try {
        // Get existing attempts to determine attempt number
        const existingAttempts = await getQuizAttemptsForUser(db, userId, quizId);
        const attemptNumber = existingAttempts.length + 1;
        
        const attemptData: Omit<QuizAttempt, 'id'> = {
            quizId,
            userId,
            courseId,
            answers: [],
            score: 0,
            percentage: 0,
            passed: false,
            timeSpent: 0,
            startedAt: new Date(),
            attemptNumber,
        };
        
        const attemptRef = await addDoc(collection(db, 'quizAttempts').withConverter(quizAttemptConverter), attemptData);
        return attemptRef.id;
    } catch (error) {
        console.error('Error starting quiz attempt:', error);
        throw new Error('Failed to start quiz attempt');
    }
}

/**
 * Submits a quiz attempt with answers
 */
export async function submitQuizAttempt(
    db: Firestore, 
    attemptId: string, 
    answers: { questionId: string; selectedAnswer: number; timeSpent: number }[],
    totalTimeSpent: number
): Promise<QuizAttempt> {
    try {
        const attemptRef = doc(db, 'quizAttempts', attemptId);
        const attemptDoc = await getDoc(attemptRef.withConverter(quizAttemptConverter));
        
        if (!attemptDoc.exists) {
            throw new Error('Quiz attempt not found');
        }
        
        const attempt = attemptDoc.data();
        const quiz = await getQuizById(db, attempt.quizId);
        
        if (!quiz) {
            throw new Error('Quiz not found');
        }
        
        // Calculate score
        let correctAnswers = 0;
        let totalPoints = 0;
        
        const processedAnswers = answers.map(answer => {
            const question = quiz.questions.find(q => q.id === answer.questionId);
            if (!question) return null;
            
            const isCorrect = answer.selectedAnswer === question.correctAnswer;
            if (isCorrect) {
                correctAnswers++;
                totalPoints += question.points;
            }
            
            return {
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect,
                timeSpent: answer.timeSpent,
            };
        }).filter(Boolean);
        
        const percentage = quiz.questions.length > 0 ? (correctAnswers / quiz.questions.length) * 100 : 0;
        const passed = percentage >= quiz.passingScore;
        
        const updatedAttempt: Partial<QuizAttempt> = {
            answers: processedAnswers,
            score: totalPoints,
            percentage,
            passed,
            timeSpent: totalTimeSpent,
            completedAt: new Date(),
        };
        
        await updateDoc(attemptRef, updatedAttempt);
        
        return {
            ...attempt,
            ...updatedAttempt,
            completedAt: updatedAttempt.completedAt!,
        };
    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        throw new Error('Failed to submit quiz attempt');
    }
}

/**
 * Gets quiz statistics for instructors
 */
export async function getQuizStats(db: Firestore, quizId: string): Promise<QuizStats | null> {
    try {
        const attempts = await getDocs(query(collection(db, 'quizAttempts'), where('quizId', '==', quizId)));
        
        if (attempts.empty) {
            return {
                totalAttempts: 0,
                averageScore: 0,
                passRate: 0,
                averageTimeSpent: 0,
                questionStats: [],
            };
        }
        
        const attemptsData = attempts.docs.map(doc => doc.data());
        const totalAttempts = attemptsData.length;
        const passedAttempts = attemptsData.filter(a => a.passed).length;
        const averageScore = attemptsData.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts;
        const passRate = (passedAttempts / totalAttempts) * 100;
        const averageTimeSpent = attemptsData.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts / 60; // Convert to minutes
        
        // Calculate question statistics
        const quiz = await getQuizById(db, quizId);
        const questionStats = quiz?.questions.map(question => {
            const questionAnswers = attemptsData.flatMap(a => 
                a.answers.filter(ans => ans.questionId === question.id)
            );
            
            const correctAnswers = questionAnswers.filter(a => a.isCorrect).length;
            const totalAnswers = questionAnswers.length;
            const avgTimeSpent = questionAnswers.length > 0 
                ? questionAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / questionAnswers.length 
                : 0;
            
            return {
                questionId: question.id,
                correctAnswers,
                totalAnswers,
                averageTimeSpent: avgTimeSpent,
                difficulty: question.difficulty,
            };
        }) || [];
        
        return {
            totalAttempts,
            averageScore,
            passRate,
            averageTimeSpent,
            questionStats,
        };
    } catch (error) {
        console.error('Error fetching quiz stats:', error);
        return null;
    }
}

/**
 * Updates a quiz
 */
export async function updateQuiz(db: Firestore, quizId: string, updates: Partial<Quiz>): Promise<void> {
    try {
        const quizRef = doc(db, 'quizzes', quizId);
        await updateDoc(quizRef, {
            ...updates,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error updating quiz:', error);
        throw new Error('Failed to update quiz');
    }
}

/**
 * Deletes a quiz
 */
export async function deleteQuiz(db: Firestore, quizId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'quizzes', quizId));
    } catch (error) {
        console.error('Error deleting quiz:', error);
        throw new Error('Failed to delete quiz');
    }
}
