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
import { Users, MessageSquare, Award, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { getCommunityStats, getTopContributors, getCommunityPosts } from '@/lib/services/community';
import { getQuizzesForCourse } from '@/lib/services/quiz';
import type { CommunityStats, CommunityPost, UserCommunityProfile, Quiz } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function CommunityPageContent() {
  const { t } = useTranslation();
  const { services } = useAuth();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [recentDiscussions, setRecentDiscussions] = useState<CommunityPost[]>([]);
  const [topContributors, setTopContributors] = useState<UserCommunityProfile[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunityData() {
      if (!services?.db) return;

      try {
        setLoading(true);
        const [statsData, contributorsData] = await Promise.all([
          getCommunityStats(services.db),
          getTopContributors(services.db, 5)
        ]);

        // Get recent community posts
        const recentPosts = await getCommunityPosts(services.db, { limit: 5 });

        // Get recent quizzes from all courses
        const allQuizzes: Quiz[] = [];
        try {
          const { getAllQuizzes } = await import('@/lib/services/quiz');
          const quizzesData = await getAllQuizzes(services.db);
          allQuizzes.push(...quizzesData.filter(quiz => quiz.isActive));
        } catch (error) {
          console.error('Error fetching quizzes:', error);
        }

        setStats(statsData);
        setRecentDiscussions(recentPosts);
        setTopContributors(contributorsData);
        setRecentQuizzes(allQuizzes.slice(0, 5)); // Show latest 5 quizzes
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunityData();
  }, [services?.db]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  if (loading) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('community')}</h1>
          <p className="text-muted-foreground">
            Connect with other learners, share knowledge, and grow together.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/community/feed">View Feed</a>
          </Button>
          <Button asChild>
            <a href="/community/feed">Create Post</a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.totalMembers || 0} total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Posts shared by community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLikes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total likes and interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.growthRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Community engagement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Posts</CardTitle>
            <CardDescription>
              Latest posts from community members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentDiscussions.length > 0 ? (
              <div className="space-y-4">
                {recentDiscussions.map(post => (
                  <div key={post.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {post.authorName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{post.authorName}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="truncate">{post.content.substring(0, 50)}...</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>•</span>
                        <span>{post.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share something!</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <a href="/community/feed">View All Posts</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>
              Most active community members this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topContributors.length > 0 ? (
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={contributor.uid} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {contributor.displayName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contributor.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.totalPosts + contributor.totalComments} contributions
                      </p>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      +{contributor.reputation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No contributors yet</p>
                <p className="text-sm text-muted-foreground">Start participating to see yourself here!</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <a href="/community/feed">View Leaderboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Guidelines</CardTitle>
          <CardDescription>
            Help us maintain a positive and supportive learning environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Be Respectful</h4>
              <p className="text-sm text-muted-foreground">
                Treat all community members with kindness and respect. Everyone is here to learn.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Share Knowledge</h4>
              <p className="text-sm text-muted-foreground">
                Help others by sharing your knowledge and experiences. We all learn from each other.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stay On Topic</h4>
              <p className="text-sm text-muted-foreground">
                Keep discussions relevant to learning and education. Avoid off-topic conversations.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Report Issues</h4>
              <p className="text-sm text-muted-foreground">
                If you see inappropriate content or behavior, please report it to our moderators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CommunityPage() {
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
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <CommunityPageContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
