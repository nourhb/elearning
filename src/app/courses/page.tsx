
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  XCircle, 
  Filter, 
  Star, 
  Users, 
  Clock, 
  Play, 
  BookOpen,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  Brain,
  Code,
  Palette,
  Music,
  Gamepad2,
  Globe,
  MapPin,
  ChevronDown,
  Grid3X3,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function CoursesPageContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const searchParams = useSearchParams();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Update search term if query param changes
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!services?.db || !user?.uid) return;

    async function fetchData() {
      if (!services?.db || !user?.uid) return;
      
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
  }, [services?.db, user?.uid]);
  
  const handleEnrollmentChange = (courseId: string) => {
    if (!user?.uid) return;
    
    // Optimistically add a progress record for the newly enrolled course
    const newProgress: UserProgress = {
      id: `new-${courseId}`,
      userId: user.uid,
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

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = allCourses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    // Sort courses
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'rating':
        // Since rating doesn't exist, sort by student count as fallback
        filtered.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
        break;
    }

    return filtered;
  }, [allCourses, searchTerm, selectedCategory, selectedLevel, sortBy]);
  
  const getCourseProgress = (courseId: string) => {
    const progress = userProgress.find(p => p.courseId === courseId);
    return progress?.progress || 0;
  }
  
  const isCourseCompleted = (courseId: string) => {
    const progress = userProgress.find(p => p.courseId === courseId);
    return progress?.completed || false;
  }

  const categories = [
    { value: 'all', label: 'All Categories', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'programming', label: 'Programming', icon: <Code className="h-4 w-4" /> },
    { value: 'design', label: 'Design', icon: <Palette className="h-4 w-4" /> },
    { value: 'music', label: 'Music', icon: <Music className="h-4 w-4" /> },
    { value: 'gaming', label: 'Gaming', icon: <Gamepad2 className="h-4 w-4" /> },
    { value: 'business', label: 'Business', icon: <Target className="h-4 w-4" /> },
    { value: 'lifestyle', label: 'Lifestyle', icon: <Globe className="h-4 w-4" /> },
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'newest', label: 'Newest', icon: <Sparkles className="h-4 w-4" /> },
    { value: 'rating', label: 'Highest Rated', icon: <Star className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Udemy-like Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unlock Your Potential
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Discover thousands of courses from expert instructors
          </p>
          
          {/* Enhanced Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-white/40"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {category.icon}
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Sort by
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setSortBy(option.value)}
                  className={sortBy === option.value ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedCourses.length} courses found
        </p>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="text-sm"
          >
            Clear search
          </Button>
        )}
      </div>
       
      {loading ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={viewMode === 'grid' ? '' : 'flex gap-4'}>
              <Skeleton className={viewMode === 'grid' ? "h-64 rounded-lg" : "h-32 w-48 rounded-lg"} />
              {viewMode === 'list' && (
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : filteredAndSortedCourses.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredAndSortedCourses.map(course => (
            <div key={course.id} className={viewMode === 'list' ? 'flex gap-4' : ''}>
              <CourseCard
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
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-20 border-2 border-dashed">
          <CardContent>
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all categories
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                Clear filters
              </Button>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                }}
              >
                Browse all courses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Categories */}
      {!searchTerm && filteredAndSortedCourses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(1).map((category) => (
              <Card 
                key={category.value}
                className="cursor-pointer hover-lift transition-all duration-200"
                onClick={() => setSelectedCategory(category.value)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    {category.icon}
                  </div>
                  <p className="text-sm font-medium">{category.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <SidebarInset className="flex-1 flex flex-col md:ml-64">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <CoursesPageWrapper />
              </main>
            </SidebarInset>
          </div>
      </SidebarProvider>
    );
}
