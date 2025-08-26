'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Target, AlertTriangle, Play } from 'lucide-react';
import { getQuizzesForCourse, getQuizAttemptsForUser } from '@/lib/services/quiz';
import { useAuth } from '@/hooks/use-auth';
import type { Quiz, QuizAttempt } from '@/lib/types';

interface QuizListProps {
  courseId: string;
}

export function QuizList({ courseId }: QuizListProps) {
  const { user, services } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (services?.db && user) {
      const fetchQuizzes = async () => {
        try {
          setLoading(true);
          const [quizzesData, attemptsData] = await Promise.all([
            getQuizzesForCourse(services.db, courseId),
            getQuizAttemptsForUser(services.db, user.uid)
          ]);
          
          setQuizzes(quizzesData);
          setAttempts(attemptsData);
        } catch (error) {
          console.error('Error fetching quizzes:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchQuizzes();
    }
  }, [courseId, services?.db, user]);

  const getAttemptsForQuiz = (quizId: string) => {
    return attempts.filter(attempt => attempt.quizId === quizId);
  };

  const getBestScore = (quizId: string) => {
    const quizAttempts = getAttemptsForQuiz(quizId);
    if (quizAttempts.length === 0) return null;
    return Math.max(...quizAttempts.map(attempt => attempt.percentage));
  };

  const canTakeQuiz = (quiz: Quiz) => {
    const attempts = getAttemptsForQuiz(quiz.id);
    return attempts.length < quiz.maxAttempts;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No quizzes available for this course yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Course Quizzes</h3>
      <div className="grid gap-4">
        {quizzes.map(quiz => {
          const attempts = getAttemptsForQuiz(quiz.id);
          const bestScore = getBestScore(quiz.id);
          const canTake = canTakeQuiz(quiz);

          return (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quiz.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {quiz.timeLimit && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(quiz.timeLimit)}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {quiz.questions.length} questions
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>Pass: {quiz.passingScore}%</span>
                    </div>
                    <div>
                      Attempts: {attempts.length}/{quiz.maxAttempts}
                    </div>
                    {bestScore !== null && (
                      <div className="text-green-600 font-medium">
                        Best: {bestScore.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!canTake ? (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Max attempts reached</span>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => router.push(`/quiz/${quiz.id}`)}
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Play className="h-4 w-4" />
                        <span>Take Quiz</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
