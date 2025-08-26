
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AchievementBadge } from '@/components/dashboard/achievement-badge';
import { CourseCard } from '@/components/dashboard/course-card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import type { Course, UserProgress, Achievement } from '@/lib/types';
import { getAllCourses } from '@/lib/services/courses';
import { getProgressForUser } from '@/lib/services/progress';
import { getEarnedAchievements } from '@/lib/services/achievements';

interface EnrolledCourse extends Course {
  progress: number;
  completed: boolean;
}

interface StudentDashboardProps {
  courses: EnrolledCourse[];
  completedCount: number;
  achievements: Achievement[];
}


function StudentDashboardContent({ courses, completedCount, achievements }: StudentDashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('welcomeBack')}, {user?.displayName?.split(' ')[0]}!</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('coursesInProgress')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length - completedCount}</div>
            <p className="text-xs text-muted-foreground">{t('keepUpGreatWork')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('completedCourses')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">{t('newMilestone')}</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h3 className="text-2xl font-semibold tracking-tight mb-4">{t('myCourses')}</h3>
         {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    progress={course.progress}
                    imageUrl={course.imageUrl}
                    aiHint={course.aiHint}
                    completed={course.completed}
                    isEnrolled={true}
                  />
              ))}
            </div>
         ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">{t('noCoursesEnrolled')}</p>
                <Button variant="link" asChild><Link href="/courses">{t('exploreCourses')}</Link></Button>
            </div>
         )}
      </section>

      <section>
        <h3 className="text-2xl font-semibold tracking-tight my-4">{t('achievements')}</h3>
        {achievements.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {achievements.map((achievement, index) => (
             <AchievementBadge
                key={achievement.id}
                icon={achievement.icon}
                name={achievement.name}
                delay={index * 0.1}
             />
          ))}
        </div>
        ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">{t('noAchievementsYet')}</p>
            </div>
        )}
      </section>
    </div>
  );
}


export default function StudentDashboardPage() {
  const { user, loading, services } = useAuth();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'student') {
        const destination = user.role === 'admin' ? '/admin' : (user.role === 'formateur' ? '/formateur' : '/');
        router.replace(destination);
        return;
    }
    if (services) {
        const fetchStudentData = async () => {
            setDataLoading(true);
            try {
                // Use the real student dashboard API
                const response = await fetch('/api/real-student-dashboard', { cache: 'no-store' });
                if (!response.ok) throw new Error('Failed to fetch student data');
                
                const data = await response.json();
                
                setEnrolledCourses(data.enrolledCourses || []);
                setCompletedCount(data.completedCount || 0);
                setAchievements(data.achievements || []);

            } catch (error) {
                console.error("Failed to fetch student data:", error);
            } finally {
                setDataLoading(false);
            }
        };
        fetchStudentData();
    }
  }, [user, loading, services, router]);


  if (loading || dataLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }
  
    return (
     <SidebarProvider>
        <div className="flex">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col md:ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto">
                <StudentDashboardContent courses={enrolledCourses} completedCount={completedCount} achievements={achievements} />
            </main>
          </SidebarInset>
        </div>
    </SidebarProvider>
  );
}
