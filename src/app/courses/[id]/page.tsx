
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseById } from '@/lib/services/courses';
import { getProgressForUser } from '@/lib/services/progress';
import type { Course, Lesson, UserProgress } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, FileText, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { CircularProgress } from '@/components/ui/circular-progress';
import { updateUserProgressAction } from './actions';


const getVideoEmbedUrl = (lesson: Lesson): string | null => {
    if (!lesson.url) return null;

    try {
        const url = new URL(lesson.url);
        switch (lesson.videoSource) {
            case 'youtube':
                // Handles standard youtube.com/watch?v=... and youtu.be/... links
                const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            case 'vimeo':
                // Handles vimeo.com/... links
                const vimeoId = url.pathname.split('/').pop();
                return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
            case 'gdrive':
                 // Handles Google Drive links by making them embeddable
                if (url.pathname.includes('/file/d/')) {
                    const fileId = url.pathname.split('/d/')[1].split('/')[0];
                    return `https://drive.google.com/file/d/${fileId}/preview`;
                }
                return null;
            default:
                return lesson.url; // For self-hosted or direct links
        }
    } catch (error) {
        console.error("Invalid video URL:", error);
        return null;
    }
};


function CoursePageContent() {
    const { id: courseId } = useParams();
    const { user, services } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);

    const totalLessons = useMemo(() => {
        return course?.modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 0;
    }, [course]);

    const completedLessonIds = useMemo(() => new Set(userProgress?.completedLessons || []), [userProgress]);
    
    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    useEffect(() => {
        if (typeof courseId === 'string' && services && user) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [courseData, progressData] = await Promise.all([
                        getCourseById(services.db, courseId as string),
                        getProgressForUser(services.db, user.uid)
                    ]);
                    
                    setCourse(courseData);
                    const currentProgress = progressData.find(p => p.courseId === courseId) || null;
                    setUserProgress(currentProgress);

                    if (courseData?.modules?.[0]?.lessons?.[0]) {
                        setActiveLesson(courseData.modules[0].lessons[0]);
                    }

                } catch (error) {
                    console.error("Failed to fetch course data:", error);
                    toast({ variant: 'destructive', title: t('error'), description: t('failedToFetchCourse') });
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [courseId, services, user, t, toast]);
    
    const handleLessonSelect = (lesson: Lesson) => {
        setActiveLesson(lesson);
    }

    const handleMarkAsComplete = async (lessonId: string) => {
        if (!user || !services?.db || !course || completedLessonIds.has(lessonId)) return;

        try {
            const wasCompletedBefore = userProgress?.completed || false;
            
            const result = await updateUserProgressAction({
                userId: user.uid,
                courseId: course.id,
                lessonId,
                totalLessons,
            });

            if (result.success && result.progress) {
                setUserProgress(result.progress);
                toast({ title: t('progressSaved'), description: t('lessonMarkedAsComplete') });
                if (result.progress.completed && !wasCompletedBefore) {
                    triggerConfetti();
                }
            } else {
                throw new Error(result.message || 'An unknown error occurred.');
            }
           
        } catch (error: any) {
            console.error("Failed to update progress:", error);
            toast({ variant: 'destructive', title: t('error'), description: String(error) });
        }
    };
    
    const renderLessonContent = () => {
        if (!activeLesson) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background rounded-lg">
                    <CardTitle>{t('welcomeToTheCourse')}</CardTitle>
                    <CardDescription className="mt-2">{t('selectLessonToStart')}</CardDescription>
                </div>
            );
        }

        switch (activeLesson.contentType) {
            case 'video':
                const embedUrl = getVideoEmbedUrl(activeLesson);
                if (!embedUrl) {
                    return <p>{t('invalidVideoUrl')}</p>;
                }
                return (
                    <div className="aspect-video w-full">
                        <iframe
                            className="w-full h-full rounded-lg"
                            src={embedUrl}
                            title={activeLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                );
            case 'document':
                 return (
                    <div className="p-8 bg-background rounded-lg text-center">
                        <FileText className="h-16 w-16 mx-auto text-primary" />
                        <h3 className="text-xl font-semibold mt-4">{activeLesson.title}</h3>
                        <p className="text-muted-foreground mt-2">{activeLesson.description}</p>
                        <Button asChild className="mt-6">
                            <a href={activeLesson.url} target="_blank" rel="noopener noreferrer">
                                {t('openDocument')} <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                 );
            case 'text':
                return <div className="prose dark:prose-invert max-w-none p-6 bg-background rounded-lg" dangerouslySetInnerHTML={{ __html: activeLesson.content || '' }} />;
            default:
                return <p>{t('unsupportedContentType')}</p>;
        }
    }

    if (loading) {
        return (
            <div className="w-full flex-1 space-y-4 p-4 md:p-8 pt-6">
                <Skeleton className="h-10 w-1/2 mb-4" />
                <Skeleton className="w-full h-12 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Skeleton className="w-full aspect-video rounded-lg" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="w-full h-64 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return <div className="flex h-full items-center justify-center"><p>{t('courseNotFound')}</p></div>;
    }

    const progressPercentage = userProgress?.progress || 0;

    return (
        <div className="w-full flex-1 p-4 md:p-6">
             <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                <p className="text-lg text-muted-foreground mt-1">{course.description}</p>
             </header>
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                 <main className="lg:col-span-3">
                     <Card>
                        <CardContent className="p-0">
                           {renderLessonContent()}
                        </CardContent>
                        {activeLesson && (
                            <CardContent className="p-6 border-t">
                                 <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                                 <p className="text-muted-foreground mt-2">{activeLesson.description}</p>
                            </CardContent>
                        )}
                     </Card>
                 </main>
                 <aside className="lg:col-span-1 lg:order-first">
                     <Card>
                        <CardHeader>
                            <CardTitle>{t('courseContent')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full flex justify-center py-4">
                                <CircularProgress value={progressPercentage} size={100} strokeWidth={8} />
                            </div>
                            {course.modules && course.modules.length > 0 && (
                                <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="w-full">
                                    {course.modules.map((module) => (
                                        <AccordionItem key={module.id} value={module.id}>
                                            <AccordionTrigger className="text-base font-semibold">{module.title}</AccordionTrigger>
                                            <AccordionContent>
                                                <ul className="space-y-2">
                                                    {(module.lessons || []).map(lesson => (
                                                        <li key={lesson.id} >
                                                            <div
                                                                className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 cursor-pointer ${activeLesson?.id === lesson.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                                                                onClick={() => handleLessonSelect(lesson)}
                                                            >
                                                            <Checkbox
                                                                    id={`lesson-${lesson.id}`}
                                                                    checked={completedLessonIds.has(lesson.id)}
                                                                    onCheckedChange={() => handleMarkAsComplete(lesson.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <span className="flex-1">{lesson.title}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </CardContent>
                     </Card>
                 </aside>
             </div>
        </div>
    );
}


export default function CoursePage() {
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
                        <CoursePageContent />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
