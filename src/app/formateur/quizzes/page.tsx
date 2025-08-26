'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Target, Users, Plus, Edit, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { Quiz, QuizStats, Course } from '@/lib/types';

function QuizzesPageContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizStats, setQuizStats] = useState<Record<string, QuizStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch quizzes using API route
        const quizzesResponse = await fetch('/api/formateur/quizzes');
        if (!quizzesResponse.ok) {
          throw new Error('Failed to fetch quizzes');
        }
        const quizzesData = await quizzesResponse.json();
        
        // Fetch courses using API route
        const coursesResponse = await fetch('/api/formateur/courses');
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }
        const coursesData = await coursesResponse.json();

        setQuizzes(quizzesData.quizzes);
        setCourses(coursesData.courses);

        // Fetch stats for each quiz using API routes
        const statsPromises = quizzesData.quizzes.map(async (quiz: any) => {
          const statsResponse = await fetch(`/api/formateur/quizzes/${quiz.id}/stats`);
          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            return { quizId: quiz.id, stats };
          }
          return { quizId: quiz.id, stats: null };
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap = statsResults.reduce((acc, { quizId, stats }) => {
          acc[quizId] = stats || {
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0,
            averageTimeSpent: 0,
            questionStats: [],
          };
          return acc;
        }, {} as Record<string, QuizStats>);

        setQuizStats(statsMap);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'No limit';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date: Date | string | any) => {
    try {
      // Handle different date formats
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        // Handle ISO string dates
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && date.toDate) {
        // Handle Firestore Timestamp
        dateObj = date.toDate();
      } else if (date && typeof date === 'object' && date.seconds) {
        // Handle Firestore Timestamp with seconds
        dateObj = new Date(date.seconds * 1000);
      } else {
        // Fallback to current date if invalid
        console.warn('Invalid date format:', date);
        dateObj = new Date();
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value:', date);
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">
            Create and manage quizzes for your courses
          </p>
        </div>
        <Link href="/formateur/quizzes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first quiz to start assessing student knowledge
            </p>
            <Link href="/formateur/quizzes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(quiz => {
            const stats = quizStats[quiz.id];
            const courseTitle = getCourseTitle(quiz.courseId);

            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {courseTitle}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={quiz.isActive ? "default" : "secondary"}>
                        {quiz.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quiz.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(quiz.timeLimit)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.passingScore}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{stats?.totalAttempts || 0} attempts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>{Math.round(stats?.averageScore || 0)}% avg</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{quiz.questions.length} questions</span>
                    <span>Created {formatDate(quiz.createdAt)}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/quiz/${quiz.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/formateur/quizzes/${quiz.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/formateur/quizzes/${quiz.id}/stats`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Stats
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QuizzesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'formateur')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'formateur') {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <QuizzesPageContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
