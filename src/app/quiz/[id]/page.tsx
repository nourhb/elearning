'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Timer,
  Trophy,
  Target
} from 'lucide-react';
import type { Quiz, QuizQuestion, QuizAttempt } from '@/lib/types';
import confetti from 'canvas-confetti';

interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  timeSpent: number;
}

function QuizPageContent() {
  const { id: quizId } = useParams();
  const { user, services } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const progress = quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0;

  useEffect(() => {
    if (typeof quizId === 'string' && user) {
      const fetchQuizData = async () => {
        try {
          setLoading(true);
          
          // Fetch quiz data using API route
          const quizResponse = await fetch(`/api/formateur/quizzes/${quizId}`);
          if (!quizResponse.ok) {
            toast({ variant: 'destructive', title: t('error'), description: 'Quiz not found' });
            router.push('/student/dashboard');
            return;
          }
          const quizData = await quizResponse.json();
          
          // Fetch attempts using API route
          let attempts = [];
          try {
            const attemptsResponse = await fetch(`/api/formateur/quizzes/${quizId}/attempts?userId=${user.uid}`);
            if (attemptsResponse.ok) {
              const attemptsData = await attemptsResponse.json();
              attempts = attemptsData.attempts || [];
            } else {
              console.warn('Failed to fetch attempts, continuing with empty attempts array');
              attempts = [];
            }
          } catch (error) {
            console.warn('Error fetching attempts:', error);
            attempts = [];
          }

          setQuiz(quizData);
          setPreviousAttempts(attempts);

          // Check if user has exceeded max attempts
          if (attempts.length >= quizData.maxAttempts) {
            toast({ 
              variant: 'destructive', 
              title: 'Maximum attempts reached', 
              description: `You have already taken this quiz ${quizData.maxAttempts} times.` 
            });
            router.push('/student/dashboard');
            return;
          }

          // Start new attempt using API route
          try {
            const attemptResponse = await fetch(`/api/formateur/quizzes/${quizId}/attempts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.uid,
                courseId: quizData.courseId,
              }),
            });
            
            if (attemptResponse.ok) {
              const attemptData = await attemptResponse.json();
              setAttemptId(attemptData.attemptId);
            } else {
              console.error('Failed to create attempt');
              toast({ variant: 'destructive', title: t('error'), description: 'Failed to start quiz attempt' });
              return;
            }
          } catch (error) {
            console.error('Error creating attempt:', error);
            toast({ variant: 'destructive', title: t('error'), description: 'Failed to start quiz attempt' });
            return;
          }

          // Set timer if quiz has time limit
          if (quizData.timeLimit) {
            setTimeRemaining(quizData.timeLimit * 60); // Convert to seconds
          }

        } catch (error) {
          console.error('Error fetching quiz data:', error);
          toast({ variant: 'destructive', title: t('error'), description: 'Failed to load quiz' });
        } finally {
          setLoading(false);
        }
      };

      fetchQuizData();
    }
  }, [quizId, user, t, toast, router]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto-submit
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Question timer effect
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuestion) return;

    // Calculate time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Update or add answer
    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          questionId: currentQuestion.id,
          selectedAnswer: answerIndex,
          timeSpent
        };
        return updated;
      } else {
        return [...prev, {
          questionId: currentQuestion.id,
          selectedAnswer: answerIndex,
          timeSpent
        }];
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !attemptId) return;

    try {
      setSubmitting(true);
      
      // Calculate total time spent
      const totalTimeSpent = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);

      // Submit quiz using API route
      const submitResponse = await fetch(`/api/formateur/quizzes/${quiz.id}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          totalTimeSpent,
        }),
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await submitResponse.json();
      setQuizResult(result);
      setShowResults(true);

      // Show confetti if passed
      if (result.passed) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      toast({ 
        title: result.passed ? 'Congratulations!' : 'Quiz completed', 
        description: result.passed 
          ? `You passed with ${result.percentage.toFixed(1)}%!` 
          : `You scored ${result.percentage.toFixed(1)}%. Keep trying!` 
      });

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to submit quiz' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSelectedAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.selectedAnswer ?? -1;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col md:ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-64 w-full" />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  if (showResults && quizResult) {
    return (
      <SidebarProvider>
        <div className="flex">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col md:ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      {quizResult.passed ? (
                        <Trophy className="h-16 w-16 text-green-500" />
                      ) : (
                        <Target className="h-16 w-16 text-orange-500" />
                      )}
                    </div>
                    <CardTitle className="text-2xl">
                      {quizResult.passed ? 'Congratulations!' : 'Quiz Completed'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold">{quizResult.percentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Spent</p>
                        <p className="text-2xl font-bold">{formatTime(quizResult.timeSpent)}</p>
                      </div>
                    </div>
                    
                    <Alert className={quizResult.passed ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                      <AlertDescription>
                        {quizResult.passed 
                          ? `You passed! You needed ${quiz.passingScore}% and scored ${quizResult.percentage.toFixed(1)}%.`
                          : `You needed ${quiz.passingScore}% to pass. Keep studying and try again!`
                        }
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-center space-x-4">
                      <Button onClick={() => router.push('/student/dashboard')}>
                        Back to Dashboard
                      </Button>
                      {!quizResult.passed && previousAttempts.length < quiz.maxAttempts && (
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Try Again
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Quiz Header */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                      <p className="text-muted-foreground mt-2">{quiz.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {timeRemaining !== null && (
                        <div className="flex items-center space-x-2">
                          <Timer className="h-5 w-5 text-orange-500" />
                          <span className="font-mono text-lg">
                            {formatTime(timeRemaining)}
                          </span>
                        </div>
                      )}
                      <Badge variant="secondary">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentQuestionIndex + 1} of {quiz.questions.length} questions
                    </p>
                  </div>
                </CardHeader>
              </Card>

              {/* Question */}
              {currentQuestion && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Question Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            {currentQuestion.question}
                          </h3>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                            <Badge variant="outline">{currentQuestion.points} points</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Answer Options */}
                      <RadioGroup 
                        value={getSelectedAnswer(currentQuestion.id).toString()}
                        onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                      >
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex space-x-2">
                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <Button onClick={handleNextQuestion}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmitQuiz}
                      disabled={submitting || answers.length < quiz.questions.length}
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Warning if not all questions answered */}
              {answers.length < quiz.questions.length && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have {quiz.questions.length - answers.length} unanswered question(s).
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default QuizPageContent;
