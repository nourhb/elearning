
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Award,
  Calendar,
  Clock,
  Star,
  Eye,
  Download,
  Plus,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Globe,
  Mail,
  Bell,
  Shield,
  Zap,
  Sparkles,
  Crown,
  Trophy,
  Medal,
  Lightbulb,
  Rocket,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw,
  Download as DownloadIcon,
  Upload,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  UserPlus,
  User,
  BookMarked,
  GraduationCap,
  MessageSquare,
  FileText,
  ImageIcon,
  Video,
  Music,
  Code,
  Palette,
  Gamepad2,
  Target as TargetIcon,
  Globe as GlobeIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnrollmentChart } from '@/components/dashboard/enrollment-chart';
import { UserRolesChart } from '@/components/dashboard/user-roles-chart';
import { UserSignupChart } from '@/components/dashboard/user-signup-chart';
import { CourseCard } from '@/components/dashboard/course-card';
import { CreateUserDialog } from '@/components/dashboard/create-user-dialog';
import { ManageUserDialog } from '@/components/dashboard/manage-user-dialog';
// Removed direct Firebase Admin imports - using API endpoints instead
import type { UserProfile, Course } from '@/lib/types';
import { 
  canCreateRole, 
  canManageRole, 
  canDeleteRole, 
  canSuspendRole,
  getCreatableRoles,
  getManageableRoles,
  ROLE_INFO,
  type UserRole 
} from '@/lib/permissions';

function AdminDashboardContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [roleDistribution, setRoleDistribution] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topPerformingUsers, setTopPerformingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isManageUserDialogOpen, setIsManageUserDialogOpen] = useState(false);

  // Get current user's role for permission checking
  const currentUserRole = user?.role as UserRole;
  const creatableRoles = getCreatableRoles(currentUserRole);
  const manageableRoles = getManageableRoles(currentUserRole);

  useEffect(() => {
    async function fetchData() {
      if (user?.uid) {
        try {
          setLoading(true);
          
          // Fetch real dashboard statistics from database
          const [statsRes, coursesRes, enrollmentRequestsRes] = await Promise.all([
            fetch('/api/dashboard/stats', { cache: 'no-store' }),
            fetch('/api/dashboard/courses', { cache: 'no-store' }),
            fetch('/api/admin/enrollment-requests', { cache: 'no-store' })
          ]);

          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData.stats || {});
            setRecentActivity(statsData.stats?.recentActivity || []);
          }

          if (coursesRes.ok) {
            const coursesData = await coursesRes.json();
            setCourses(coursesData.courses || []);
          }

          if (enrollmentRequestsRes.ok) {
            const enrollmentData = await enrollmentRequestsRes.json();
            setEnrollmentRequests(enrollmentData.requests || []);
          }

          // Fetch users data
          try {
            const usersRes = await fetch('/api/dashboard/users', { cache: 'no-store' });
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              setUsers(usersData.users || []);
              setRoleDistribution(usersData.roleDistribution || {});
            }
          } catch (error) {
            console.error('Failed to fetch users:', error);
          }

        } catch (error) {
          console.error('Failed to fetch data:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load dashboard data',
          });
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user, toast]);

  const handleUserCreated = () => {
    setIsCreateUserDialogOpen(false);
    // Refresh dashboard data
    Promise.all([
      fetch('/api/dashboard/stats', { cache: 'no-store' }),
      fetch('/api/dashboard/courses', { cache: 'no-store' }),
      fetch('/api/admin/enrollment-requests', { cache: 'no-store' }),
      fetch('/api/dashboard/users', { cache: 'no-store' })
    ]).then(async ([statsRes, coursesRes, enrollmentRequestsRes, usersRes]) => {
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
        setRecentActivity(statsData.stats?.recentActivity || []);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (enrollmentRequestsRes.ok) {
        const enrollmentData = await enrollmentRequestsRes.json();
        setEnrollmentRequests(enrollmentData.requests || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        setRoleDistribution(usersData.roleDistribution || {});
      }
    }).catch(error => {
      console.error('Failed to refresh dashboard data:', error);
    });
  };

  const handleUserUpdate = () => {
    setIsManageUserDialogOpen(false);
    setSelectedUser(null);
    // Refresh dashboard data using new API
    Promise.all([
      fetch('/api/dashboard/stats', { cache: 'no-store' }),
      fetch('/api/dashboard/courses', { cache: 'no-store' }),
      fetch('/api/admin/enrollment-requests', { cache: 'no-store' }),
      fetch('/api/dashboard/users', { cache: 'no-store' })
    ]).then(async ([statsRes, coursesRes, enrollmentRequestsRes, usersRes]) => {
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
        setRecentActivity(statsData.stats?.recentActivity || []);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (enrollmentRequestsRes.ok) {
        const enrollmentData = await enrollmentRequestsRes.json();
        setEnrollmentRequests(enrollmentData.requests || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        setRoleDistribution(usersData.roleDistribution || {});
      }
    }).catch(error => {
      console.error('Failed to refresh dashboard data:', error);
    });
  };

  const handleManageUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsManageUserDialogOpen(true);
  };

  const handleCourseApproval = async (courseId: string, action: 'approve' | 'reject') => {
    try {
      console.log('Handling course approval:', { courseId, action });
      
      const response = await fetch('/api/admin/course-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          action,
          reason: action === 'reject' ? 'Course needs revisions' : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process course approval');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: result.message,
      });

      // Refresh the dashboard data
      window.location.reload();
    } catch (error) {
      console.error('Error processing course approval:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process course approval',
      });
    }
  };

  const handleEnrollmentRequest = async (requestId: string, status: 'approved' | 'denied') => {
    try {
      console.log('Handling enrollment request:', { requestId, status });
      
      // Try test API first (no authentication required)
      let response = await fetch('/api/test-enrollment-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
          responseMessage: status === 'approved' ? 'Request approved by administrator' : 'Request denied by administrator'
        }),
      });

      if (!response.ok) {
        console.log('Test API failed, trying authenticated API...');
        // If test API fails, try the authenticated API
        response = await fetch('/api/admin/enrollment-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId,
            status,
            responseMessage: status === 'approved' ? 'Request approved by administrator' : 'Request denied by administrator'
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to respond to enrollment request');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: result.message,
      });

      // Refresh the dashboard data
      window.location.reload();
    } catch (error) {
      console.error('Error responding to enrollment request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to respond to enrollment request',
      });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'formateur':
        return <GraduationCap className="h-4 w-4" />;
      case 'student':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const canManageThisUser = (targetUser: UserProfile) => canManageRole(currentUserRole, targetUser.role);
  const canDeleteThisUser = (targetUser: UserProfile) => canDeleteRole(currentUserRole, targetUser.role);
  const canSuspendThisUser = (targetUser: UserProfile) => canSuspendRole(currentUserRole, targetUser.role);



  return (
    <>
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.displayName}. You have <strong>complete administrative control</strong> over the entire platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setLoading(true);
                fetch('/api/admin/dashboard', { cache: 'no-store' })
                  .then(res => res.json())
                  .then(data => {
                    setUsers(data.users || []);
                    setCourses(data.courses || []);
                    setCommunityPosts(data.communityPosts || []);
                    setPostComments(data.postComments || []);
                    setMessages(data.messages || []);
                    setStats(data.stats || {});
                    setRoleDistribution(data.roleDistribution || {});
                    setRecentActivity(data.recentActivity || []);
                    setTopPerformingUsers(data.topPerformingUsers || []);
                    toast({
                      title: 'Success',
                      description: 'Dashboard data refreshed',
                    });
                  })
                  .catch(error => {
                    console.error('Failed to refresh:', error);
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Failed to refresh dashboard data',
                    });
                  })
                  .finally(() => setLoading(false));
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/cleanup-blob-urls', { method: 'POST' });
                  const data = await response.json();
                  
                  if (data.success) {
                    toast({
                      title: 'Success',
                      description: data.message,
                    });
                    // Refresh the dashboard
                    window.location.reload();
                  } else {
                    throw new Error(data.error);
                  }
                } catch (error) {
                  console.error('Failed to cleanup blob URLs:', error);
                  toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to cleanup blob URLs',
                  });
                }
              }}
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Cleanup Blob URLs
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsers || 0}</div>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                +{stats.newUsersThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activeUsers || 0}</div>
              <p className="text-xs text-green-600 dark:text-green-300">
                {stats.suspendedUsers || 0} suspended
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalCourses || 0}</div>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                {stats.publishedCourses || 0} published
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.totalEnrollments || 0}</div>
              <p className="text-xs text-orange-600 dark:text-orange-300">
                {stats.completedEnrollments || 0} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Community Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">{stats.totalPosts || 0}</div>
              <p className="text-xs text-pink-600 dark:text-pink-300">
                {stats.pinnedPosts || 0} pinned
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <FileText className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.totalComments || 0}</div>
              <p className="text-xs text-indigo-600 dark:text-indigo-300">
                {stats.deletedComments || 0} deleted
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">{stats.totalMessages || 0}</div>
              <p className="text-xs text-teal-600 dark:text-teal-300">
                {stats.deletedMessages || 0} deleted
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Trophy className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.averageCompletionRate || 0}%</div>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Course completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="enrollment-requests">Enrollment Requests</TabsTrigger>
            <TabsTrigger value="course-approvals">Course Approvals</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment Trends</CardTitle>
                    <CardDescription>Student enrollment over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnrollmentChart courses={courses} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Roles Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserRolesChart users={users} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserSignupChart users={users} />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setIsCreateUserDialogOpen(true)} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create New User
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create Course
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Reports
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Role Management Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Complete administrative control</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">You can create:</p>
                      <div className="flex flex-wrap gap-1">
                        {creatableRoles.map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {getRoleIcon(role)}
                            {ROLE_INFO[role].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">You can manage:</p>
                      <div className="flex flex-wrap gap-1">
                        {manageableRoles.map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {getRoleIcon(role)}
                            {ROLE_INFO[role].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        <strong>Full Access:</strong> You can create, manage, delete, and suspend users of any role, including other administrators.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {activity.user?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.user}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.action} • {new Date(activity.time).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all users on the platform. You can create, edit, and manage users based on your role permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {user.displayName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {getRoleIcon(user.role)}
                            {ROLE_INFO[user.role].label}
                          </Badge>
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                            {user.createdBy && (
                              <span className="ml-2">
                                by {users.find(u => u.uid === user.createdBy)?.displayName || 'Unknown'}
                              </span>
                            )}
                          </div>
                          {canManageThisUser(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManageUser(user)}
                            >
                              Manage
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
                <CardDescription>Manage all courses on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      progress={0}
                      imageUrl={course.imageUrl}
                      aiHint=""
                      completed={false}
                      instructorId={course.instructorId}
                      showManagementButtons={true}
                      onEdit={(courseId) => {
                        // Handle edit
                        console.log('Edit course:', courseId);
                      }}
                      onDelete={(courseId) => {
                        // Handle delete
                        console.log('Delete course:', courseId);
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollment-requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Reviews</CardTitle>
                <CardDescription>Review and manage student enrollments (students can start learning immediately)</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : enrollmentRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No enrollment reviews</h3>
                    <p className="text-muted-foreground">No pending enrollment reviews at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollmentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {request.studentName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              Enrolled in "{request.courseTitle}" - Awaiting admin review
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={request.status === 'pending' ? 'default' : 
                                   request.status === 'approved' ? 'default' : 'destructive'}
                          >
                            {request.status}
                          </Badge>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleEnrollmentRequest(request.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleEnrollmentRequest(request.id, 'denied')}
                              >
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="course-approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Approvals</CardTitle>
                <CardDescription>Review and approve/reject courses submitted by instructors</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : courses.filter(course => (course as any).status === 'pending_approval').length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending course approvals</h3>
                    <p className="text-muted-foreground">All courses have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.filter(course => (course as any).status === 'pending_approval').map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {course.title?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-muted-foreground">
                              By {(course as any).instructorName} - {course.category} • {course.level}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date((course as any).createdAt || new Date()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            Pending Approval
                          </Badge>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleCourseApproval(course.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleCourseApproval(course.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Management</CardTitle>
                <CardDescription>Manage community posts, comments, and messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Community Posts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Posts</CardTitle>
                      <CardDescription>Community posts management</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">{stats.totalPosts || 0}</span>
                          <Badge variant="outline">Total</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg">{stats.pinnedPosts || 0}</span>
                          <Badge variant="secondary">Pinned</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg">{stats.deletedPosts || 0}</span>
                          <Badge variant="destructive">Deleted</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Comments</CardTitle>
                      <CardDescription>Post comments management</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">{stats.totalComments || 0}</span>
                          <Badge variant="outline">Total</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg">{stats.deletedComments || 0}</span>
                          <Badge variant="destructive">Deleted</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chat Messages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <CardDescription>Chat messages management</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">{stats.totalMessages || 0}</span>
                          <Badge variant="outline">Total</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg">{stats.deletedMessages || 0}</span>
                          <Badge variant="destructive">Deleted</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Community Activity */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Recent Community Activity</CardTitle>
                    <CardDescription>Latest posts and comments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {communityPosts.slice(0, 5).map((post) => (
                        <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {post.authorName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{post.authorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {post.content?.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {post.isPinned && <Badge variant="secondary">Pinned</Badge>}
                            {post.isDeleted && <Badge variant="destructive">Deleted</Badge>}
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>User Engagement</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Course Completion</span>
                      <span>72%</span>
                    </div>
                    <Progress value={72} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>System Uptime</span>
                      <span>99.9%</span>
                    </div>
                    <Progress value={99.9} className="mt-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingUsers.map((user, index) => (
                      <div key={user.uid} className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Badge variant="outline">{index + 1}</Badge>
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.displayName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.coursesCompleted} courses • {user.averageScore}% avg
                          </p>
                        </div>
                        <Badge variant="secondary">{user.badges} badges</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        setIsOpen={setIsCreateUserDialogOpen}
        onUserCreated={handleUserCreated}
        creatorId={user?.uid || ''}
        creatorRole={currentUserRole}
      />

      {/* Manage User Dialog */}
      {selectedUser && (
        <ManageUserDialog
          isOpen={isManageUserDialogOpen}
          setIsOpen={setIsManageUserDialogOpen}
          user={selectedUser}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </>
  );
}

function AdminDashboardWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p>Loading...</p></div>}>
      <AdminDashboardContent />
    </Suspense>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <AdminDashboardWrapper />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
