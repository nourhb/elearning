
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import type { Course, UserProgress } from '@/lib/types';
import { getAllCourses } from '@/lib/services/courses';
import { getProgressForUser } from '@/lib/services/progress';
import { CourseCard } from '@/components/dashboard/course-card';
import { Input } from '@/components/ui/input';
import { Search, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function CoursesPageContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const searchParams = useSearchParams();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    // Update search term if query param changes
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!services || !user) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [coursesData, progressData] = await Promise.all([
            getAllCourses(services.db),
            getProgressForUser(services.db, user.uid)
        ]);

        setAllCourses(coursesData.filter(c => c.status === 'Published'));
        setUserProgress(progressData);

      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [services, user]);
  
  const handleEnrollmentChange = (courseId: string) => {
    // Optimistically add a progress record for the newly enrolled course
    const newProgress: UserProgress = {
      id: `new-${courseId}`,
      userId: user!.uid,
      courseId: courseId,
      progress: 0,
      completed: false,
      completedLessons: [],
      startedAt: new Date(),
    };
    setUserProgress(prev => [...prev, newProgress]);
  };

  const enrolledCourseIds = useMemo(() => {
      return new Set(userProgress.map(p => p.courseId));
  }, [userProgress]);


  const filteredCourses = useMemo(() => {
    if (!searchTerm) return allCourses;
    return allCourses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCourses, searchTerm]);
  
  const getCourseProgress = (courseId: string) => {
    const progress = userProgress.find(p => p.courseId === courseId);
    return progress?.progress || 0;
  }
  
  const isCourseCompleted = (courseId: string) => {
    const progress = userProgress.find(p => p.courseId === courseId);
    return progress?.completed || false;
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('exploreCourses')}</h2>
            <p className="text-muted-foreground">{t('browseAndEnroll')}</p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchCoursesByTitle')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
                <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
       
       {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[400px] rounded-lg" />)}
        </div>
       ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                progress={getCourseProgress(course.id)}
                imageUrl={course.imageUrl}
                aiHint={course.aiHint}
                completed={isCourseCompleted(course.id)}
                isEnrolled={enrolledCourseIds.has(course.id)}
                onEnrollmentChange={handleEnrollmentChange}
              />
           ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">{t('noCoursesFound')}</h3>
            <p className="text-muted-foreground mt-2">{t('tryDifferentSearchTerm')}</p>
          </div>
        )}
    </div>
  );
}

function CoursesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p>Loading...</p></div>}>
      <CoursesPageContent />
    </Suspense>
  )
}

export default function CoursesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
    }
  
    return (
       <SidebarProvider>
          <div className="flex">
            <AppSidebar />
            <SidebarInset className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <CoursesPageWrapper />
              </main>
            </SidebarInset>
          </div>
      </SidebarProvider>
    );
}
