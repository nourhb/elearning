
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, BookOpen, Users, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Course } from '@/lib/types';
import { getCoursesByInstructor } from '@/lib/services/courses';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { EnrollmentChart } from '@/components/dashboard/enrollment-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreateUserDialog } from '@/components/dashboard/create-user-dialog';
import { getCourseImageUrl } from '@/lib/utils';


function FormateurDashboardContent() {
  const { user, services } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.uid && services) {
      async function fetchCourses() {
        try {
          setLoading(true);
          const fetchedCourses = await getCoursesByInstructor(services.db, user.uid);
          setCourses(fetchedCourses);
        } catch (error) {
          console.error('Failed to fetch courses:', error);
        } finally {
          setLoading(false);
        }
      }
      fetchCourses();
    }
  }, [user, services]);
  
  const handleUserCreated = () => {
      // For now, we don't display user info on the formateur dashboard
      // so a refresh isn't strictly necessary, but good practice.
      setIsCreateUserDialogOpen(false);
  }

  return (
    <>
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('formateurDashboard')}</h2>
          <div className="flex items-center gap-2">
             <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                {t('addStudent')}
            </Button>
            <Link href="/formateur/courses/new">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('createNewCourse')}
                </Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalCourses')}</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">{t('coursesYouManage')}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalStudents')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                    {courses.reduce((acc, course) => acc + (course.studentCount || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('acrossAllYourCourses')}</p>
              </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('courseEnrollment')}</CardTitle>
              <CardDescription>{t('studentEnrollmentByCourse')}</CardDescription>
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-[250px]" /> : <EnrollmentChart courses={courses} />}
            </CardContent>
          </Card>
        </div>

         <section>
          <h3 className="text-2xl font-semibold tracking-tight my-4">{t('myCourses')}</h3>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[400px] rounded-lg" />
                <Skeleton className="h-[400px] rounded-lg" />
                <Skeleton className="h-[400px] rounded-lg" />
             </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                 <Card key={course.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                   <CardHeader className="p-0 relative">
                      <div className="relative h-48 w-full">
                          <Image
                              src={getCourseImageUrl(course)}
                              alt={course.title}
                              fill
                              style={{objectFit: 'cover'}}
                              className="transition-transform group-hover:scale-105"
                              data-ai-hint={course.aiHint || 'course content'}
                          />
                      </div>
                      <Badge className="absolute top-2 right-2" variant={course.status === 'Published' ? 'default' : 'secondary'}>{t(course.status)}</Badge>
                   </CardHeader>
                   <CardContent className="p-4 flex-grow">
                     <CardTitle className="mb-2 font-headline text-xl">{course.title}</CardTitle>
                     <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                   </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link href={`/formateur/courses/${course.id}/edit`} className="w-full">
                          <Button variant="outline" className="w-full">
                              <Edit className="mr-2 h-4 w-4" />
                              {t('editCourse')}
                          </Button>
                      </Link>
                    </CardFooter>
                 </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">{t('noCoursesFound')}</p>
              <Link href="/formateur/courses/new" className="mt-4 inline-block">
                  <Button>{t('createYourFirstCourse')}</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
      <CreateUserDialog 
        isOpen={isCreateUserDialogOpen}
        setIsOpen={setIsCreateUserDialogOpen}
        onUserCreated={handleUserCreated}
        creatorId={user?.uid || ''}
        creatorRole={user?.role as 'admin' | 'formateur'}
      />
    </>
  );
}


export default function FormateurPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
  
    useEffect(() => {
        if (!loading && (!user || (user.role !== 'formateur' && user.role !== 'admin'))) {
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
                <FormateurDashboardContent />
              </main>
            </SidebarInset>
          </div>
      </SidebarProvider>
    );
  }
