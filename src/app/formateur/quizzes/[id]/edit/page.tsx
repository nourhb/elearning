'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Quiz } from '@/lib/types';

function EditQuizPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/formateur/quizzes/${id}`);
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
        } else {
          console.error('Failed to fetch quiz');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [user, id]);

  if (loading) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Link href="/formateur/quizzes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">The quiz you're looking for doesn't exist.</p>
            <Link href="/formateur/quizzes">
              <Button className="mt-4">Back to Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/formateur/quizzes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Quiz</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Editor</CardTitle>
          <CardDescription>
            Edit quiz: {quiz.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Quiz editing functionality is coming soon!
            </p>
            <p className="text-sm text-muted-foreground">
              For now, you can view the quiz details and manage it from the quiz management page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <EditQuizPageContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
