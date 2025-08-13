
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, UserPlus, UserCog, Users, Database } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfile, Course } from '@/lib/types';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';
import { ManageUserDialog } from '@/components/dashboard/manage-user-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { approveCourseAction, getAdminDashboardData, seedDatabaseAction } from './actions';
import { CreateUserDialog } from '@/components/dashboard/create-user-dialog';


const UserSignupChart = dynamic(() => import('@/components/dashboard/user-signup-chart').then(mod => mod.UserSignupChart), {
  loading: () => <Skeleton className="h-[250px]" />,
  ssr: false
});

const UserRolesChart = dynamic(() => import('@/components/dashboard/user-roles-chart').then(mod => mod.UserRolesChart), {
  loading: () => <Skeleton className="h-[250px]" />,
  ssr: false
});

function AdminDashboardContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const fetchUsersAndCourses = async () => {
    try {
      setLoading(true);
      const { users: fetchedUsers, courses: fetchedCourses } = await getAdminDashboardData();
      
      const sortedUsers = fetchedUsers.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setUsers(sortedUsers as UserProfile[]);
      setCourses(fetchedCourses as Course[]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ variant: 'destructive', title: t('error'), description: t('failedToFetchData') });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsersAndCourses();
  }, []);

  const handleManageUserClick = (user: UserProfile) => {
    setSelectedUser(user);
  };
  
  const handleApproveCourse = async (courseId: string) => {
    try {
        await approveCourseAction(courseId);
        toast({ title: t('courseApproved'), description: t('courseIsNowLive') });
        fetchUsersAndCourses(); // Refresh course list
    } catch (error) {
        toast({ variant: 'destructive', title: t('error'), description: t('failedToApproveCourse') });
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
        const message = await seedDatabaseAction();
        toast({ title: t('databaseSeeded'), description: message });
        fetchUsersAndCourses();
    } catch (error: any) {
        toast({ variant: 'destructive', title: t('error'), description: error.message || t('failedToSeedDatabase') });
    } finally {
        setIsSeeding(false);
    }
  };
  
  const handleUserUpdate = () => {
    setSelectedUser(null); // Close dialog
    fetchUsersAndCourses(); // Refresh data
  }
  
  const handleUserCreated = () => {
    fetchUsersAndCourses(); // Refresh data
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const newUsersThisMonth = users.filter(user => {
    const userDate = new Date(user.createdAt);
    const today = new Date();
    return userDate.getMonth() === today.getMonth() && userDate.getFullYear() === today.getFullYear();
  }).length;

  return (
    <>
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('adminDashboard')}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalCourses')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('newUsersThisMonth')}</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{newUsersThisMonth}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('databaseUtilities')}</CardTitle>
            </CardHeader>
            <CardContent>
               <Button onClick={handleSeedDatabase} disabled={isSeeding} className="w-full">
                <Database className="mr-2 h-4 w-4" />
                {isSeeding ? t('seeding') : t('seedDatabase')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>{t('userSignups')}</CardTitle>
              <CardDescription>{t('signupsOverLastMonths')}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? <Skeleton className="h-[250px]" /> : <UserSignupChart users={users} />}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t('userRoles')}</CardTitle>
              <CardDescription>{t('distributionOfUserRoles')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[250px]" /> : <UserRolesChart users={users} />}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                  <CardTitle>{t('userManagement')}</CardTitle>
                  <CardDescription>{t('manageUsersAndRoles')}</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsCreateUserDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('createUser')}
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <p>{t('loadingUsers')}</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('user')}</TableHead>
                      <TableHead>{t('role')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={`/Countries-page-image-placeholder-800x500.webp`} alt="Avatar" />
                              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.displayName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{t(user.role)}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                            {t(user.status || 'active')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleManageUserClick(user)}>
                              <UserCog className="h-4 w-4" />
                              <span className="sr-only">{t('manageUser')}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('contentModeration')}</CardTitle>
              <CardDescription>{t('approveOrRejectCourses')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <p>{t('loadingCourses')}</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('course')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.filter(c => c.status === 'Draft').map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell><Badge variant={course.status === 'Published' ? 'default' : 'outline'}>{t(course.status)}</Badge></TableCell>
                        <TableCell className="text-right">
                          {course.status === 'Draft' && (
                              <Button size="sm" onClick={() => handleApproveCourse(course.id)}>{t('approve')}</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {selectedUser && (
        <ManageUserDialog
            isOpen={!!selectedUser}
            setIsOpen={(isOpen) => !isOpen && setSelectedUser(null)}
            user={selectedUser}
            onUserUpdate={handleUserUpdate}
        />
      )}
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

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
  
    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
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
                <AdminDashboardContent />
              </main>
            </SidebarInset>
          </div>
      </SidebarProvider>
    );
  }
