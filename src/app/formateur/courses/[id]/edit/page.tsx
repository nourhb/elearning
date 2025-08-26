
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { generateCourseModules } from '@/ai/flows/generate-course-modules';
import { updateCourseAction, deleteCourseAction } from './actions';
import { getCourseById } from '@/lib/services/courses';
import type { Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudinaryImageUpload } from '@/components/dashboard/cloudinary-image-upload';

type FormData = {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  level: string;
  modules: {
    id: string;
    title: string;
    lessons: {
        id: string;
        title: string;
        description?: string;
        contentType: 'video' | 'document' | 'text';
        videoSource?: 'youtube' | 'vimeo' | 'gdrive' | 'self-hosted' | null;
        url?: string;
        content?: string;
    }[];
  }[];
};


function EditCourseForm() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const { services } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [state, formAction, isSubmitting] = useActionState(updateCourseAction, null);

  const {
    control,
    watch,
    setValue,
    reset,
    formState: { isDirty },
    register,
    getValues
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      modules: [],
    },
  });

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control,
    name: 'modules',
  });

  const courseTitle = watch('title');
  const imageUrl = watch('imageUrl');

   useEffect(() => {
    if (courseId && services?.db) {
      setLoading(true);
      getCourseById(services.db, courseId)
        .then(courseData => {
          if (courseData) {
            const formData: FormData = {
                title: courseData.title,
                description: courseData.description,
                imageUrl: courseData.imageUrl,
                category: courseData.category || 'programming',
                level: courseData.level || 'beginner',
                modules: courseData.modules.map(m => ({
                    id: m.id,
                    title: m.title,
                    lessons: (m.lessons || []).map(l => ({
                        id: l.id,
                        title: l.title,
                        description: l.description,
                        contentType: l.contentType,
                        videoSource: l.videoSource,
                        url: l.url,
                        content: l.content,
                    })),
                })),
            };
            reset(formData);
          } else {
             toast({ variant: 'destructive', title: t('courseNotFound') });
             router.push('/formateur');
          }
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: t('failedToFetchCourse') });
        })
        .finally(() => setLoading(false));
    }
  }, [courseId, services?.db, reset, router, t, toast]);


  useEffect(() => {
    if (!state) return;
    
    if (state.success) {
      toast({
        title: t('courseUpdatedSuccessfully'),
        description: t('yourChangesHaveBeenSaved'),
      });
      // Reset the form to its new state, clearing the 'dirty' status
      reset(getValues());
    } else if (state.message && !state.errors) {
       toast({
        variant: 'destructive',
        title: t('failedToUpdateCourse'),
        description: state.message,
      });
    }
  }, [state, toast, t, reset, getValues]);


  const handleGenerateModules = async () => {
    if (!courseTitle) {
      toast({
        variant: 'destructive',
        title: t('titleIsRequired'),
        description: t('pleaseEnterCourseTitleFirst'),
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateCourseModules({ title: courseTitle });
      const moduleData = result.modules.map((m, index) => ({ 
        id: `module-${Date.now()}-${index}`,
        title: m.title,
        lessons: []
      }));
      setValue('modules', moduleData, { shouldDirty: true });
      toast({
        title: t('modulesGenerated'),
        description: t('aiHasCreatedModuleList'),
      });
    } catch (error) {
      console.error('Failed to generate modules:', error);
      toast({
        variant: 'destructive',
        title: t('generationFailed'),
        description: t('aiCouldNotGenerateModules'),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCourse = async () => {
      setIsDeleting(true);
      try {
          await deleteCourseAction(courseId);
          toast({ title: t('courseDeleted'), description: t('courseHasBeenPermanentlyDeleted') });
          router.push('/formateur');
      } catch (error: any) {
          toast({ variant: 'destructive', title: t('deleteFailed'), description: error.message });
      } finally {
          setIsDeleting(false);
      }
  };
  
  const LessonsFieldArray = ({ moduleIndex }: { moduleIndex: number }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `modules.${moduleIndex}.lessons`
    });

    return (
      <div className="space-y-4 pl-4 border-l-2 border-dashed ml-2">
        {fields.map((lesson, lessonIndex) => (
          <div key={lesson.id} className="p-4 bg-background/50 rounded-lg space-y-3 relative">
             <input type="hidden" {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.id`)} />
             <div className="flex justify-between items-center">
                <Label htmlFor={`lesson-title-${moduleIndex}-${lessonIndex}`} className="text-base font-semibold">{t('lesson')} {lessonIndex + 1}</Label>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(lessonIndex)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            
             <div className="space-y-2">
                <Label htmlFor={`lesson-title-${moduleIndex}-${lessonIndex}`}>{t('lessonTitle')}</Label>
                <Input
                    id={`lesson-title-${moduleIndex}-${lessonIndex}`}
                    {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.title`)}
                    placeholder={t('e.g. Introduction to React Hooks')}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`lesson-description-${moduleIndex}-${lessonIndex}`}>{t('lessonDescription')}</Label>
                <Textarea
                    id={`lesson-description-${moduleIndex}-${lessonIndex}`}
                    {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.description`)}
                    placeholder={t('describeTheLesson')}
                    rows={3}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('contentType')}</Label>
                    <Controller
                        control={control}
                        name={`modules.${moduleIndex}.lessons.${lessonIndex}.contentType`}
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectContentType')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">{t('video')}</SelectItem>
                                    <SelectItem value="document">{t('document')}</SelectItem>
                                    <SelectItem value="text">{t('text')}</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                {watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentType`) === 'video' && (
                     <div className="space-y-2">
                         <Label>{t('videoSource')}</Label>
                         <Controller
                            control={control}
                            name={`modules.${moduleIndex}.lessons.${lessonIndex}.videoSource`}
                            render={({ field }) => (
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectVideoSource')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="youtube">{t('youtube')}</SelectItem>
                                        <SelectItem value="vimeo">{t('vimeo')}</SelectItem>
                                        <SelectItem value="gdrive">{t('googleDrive')}</SelectItem>
                                        <SelectItem value="self-hosted">{t('selfHosted')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                     </div>
                )}
            </div>
            
            {(watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentType`) === 'video' || watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentType`) === 'document') && (
                 <div className="space-y-2">
                    <Label htmlFor={`lesson-url-${moduleIndex}-${lessonIndex}`}>{t('url')}</Label>
                    <Input
                        id={`lesson-url-${moduleIndex}-${lessonIndex}`}
                        {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.url`)}
                        placeholder="https://"
                    />
                </div>
            )}
             {watch(`modules.${moduleIndex}.lessons.${lessonIndex}.contentType`) === 'text' && (
                 <div className="space-y-2">
                    <Label htmlFor={`lesson-content-${moduleIndex}-${lessonIndex}`}>{t('textContent')}</Label>
                    <Textarea
                        id={`lesson-content-${moduleIndex}-${lessonIndex}`}
                        {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.content`)}
                        placeholder={t('writeYourLessonContentHere')}
                        rows={6}
                    />
                </div>
            )}
          </div>
        ))}
        <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => append({ 
                id: `lesson-${Date.now()}`, 
                title: '', 
                description: '', 
                contentType: 'text',
                videoSource: null,
                url: '',
                content: ''
            })}
        >
          <PlusCircle className="mr-2 h-4 w-4"/>
          {t('addLesson')}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="space-y-6">
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
         <h2 className="text-3xl font-bold tracking-tight">{t('editCourse')}</h2>
       </div>
       <form 
        action={(formData) => {
            const values = getValues();
            formData.set('modules', JSON.stringify(values.modules));
            formAction(formData);
        }}
        className="space-y-6"
       >
        <input type="hidden" name="courseId" value={courseId} />
        <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field }) => (
                <input type="hidden" {...field} name="title" />
            )}
        />
        <Controller
            name="description"
            control={control}
            rules={{ required: 'Description is required' }}
            render={({ field }) => (
                <input type="hidden" {...field} name="description" />
            )}
        />
        <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
                <input type="hidden" {...field} name="imageUrl" />
            )}
        />
        <Controller
            name="category"
            control={control}
            render={({ field }) => (
                <input type="hidden" {...field} name="category" />
            )}
        />
        <Controller
            name="level"
            control={control}
            render={({ field }) => (
                <input type="hidden" {...field} name="level" />
            )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle>{t('courseDetails')}</CardTitle>
                   <CardDescription>{t('updateCourseInformation')}</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="title">{t('courseTitle')}</Label>
                       <Controller
                         name="title"
                         control={control}
                         rules={{ required: 'Title is required.' }}
                         render={({ field }) => <Input id="title" placeholder={t('e.g. Introduction to AI')} {...field} />}
                       />
                       {(state?.errors?.title) && <p className="text-sm text-destructive">{state?.errors?.title}</p>}
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="description">{t('courseDescription')}</Label>
                       <Controller
                         name="description"
                         control={control}
                         rules={{ required: 'Description is required.' }}
                         render={({ field }) => (
                           <Textarea
                             id="description"
                             placeholder={t('describeYourCourse')}
                             className="min-h-[150px]"
                             {...field}
                           />
                         )}
                       />
                       {(state?.errors?.description) && <p className="text-sm text-destructive">{state?.errors?.description}</p>}
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="category">{t('category')}</Label>
                         <Controller
                           name="category"
                           control={control}
                           render={({ field }) => (
                             <select
                               id="category"
                               name="category"
                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                               {...field}
                             >
                               <option value="programming">Programming</option>
                               <option value="design">Design</option>
                               <option value="music">Music</option>
                               <option value="gaming">Gaming</option>
                               <option value="business">Business</option>
                               <option value="lifestyle">Lifestyle</option>
                             </select>
                           )}
                         />
                         {(state?.errors?.category) && <p className="text-sm text-destructive">{state?.errors?.category}</p>}
                       </div>
                       
                       <div className="space-y-2">
                         <Label htmlFor="level">{t('level')}</Label>
                         <Controller
                           name="level"
                           control={control}
                           render={({ field }) => (
                             <select
                               id="level"
                               name="level"
                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                               {...field}
                             >
                               <option value="beginner">Beginner</option>
                               <option value="intermediate">Intermediate</option>
                               <option value="advanced">Advanced</option>
                             </select>
                           )}
                         />
                         {(state?.errors?.level) && <p className="text-sm text-destructive">{state?.errors?.level}</p>}
                       </div>
                     </div>
                 </CardContent>
               </Card>
               <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{t('courseCurriculum')}</CardTitle>
                                <CardDescription>{t('manageModulesAndLessons')}</CardDescription>
                            </div>
                             <Button type="button" size="sm" onClick={handleGenerateModules} disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {t('generateWithAI')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Accordion type="multiple" className="w-full" defaultValue={moduleFields.map(f => f.id)}>
                            {moduleFields.map((moduleItem, moduleIndex) => (
                               <AccordionItem key={moduleItem.id} value={moduleItem.id}>
                                   <div className="flex w-full items-center justify-between p-4 hover:bg-muted/50 rounded-md">
                                      <input type="hidden" {...register(`modules.${moduleIndex}.id`)} />
                                      <AccordionTrigger className="flex-1 text-left p-0 hover:no-underline">
                                        <Controller
                                            name={`modules.${moduleIndex}.title`}
                                            control={control}
                                            rules={{ required: 'Module title cannot be empty.' }}
                                            render={({ field }) => (
                                                <Input 
                                                    {...field}
                                                    placeholder={`${t('module')} ${moduleIndex + 1} ${t('title')}`}
                                                    className="w-auto flex-1 font-medium bg-transparent border-none focus-visible:ring-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                          />
                                      </AccordionTrigger>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeModule(moduleIndex)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                   </div>
                                   <AccordionContent className="p-4 pt-0">
                                       <LessonsFieldArray moduleIndex={moduleIndex} />
                                   </AccordionContent>
                               </AccordionItem>
                            ))}
                       </Accordion>
                       {(state?.errors?.modules) && <p className="mt-2 text-sm text-destructive">{state?.errors?.modules}</p>}

                        <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => appendModule({ id: `module-${Date.now()}`, title: '', lessons: [] })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('addModule')}
                        </Button>
                    </CardContent>
                </Card>
           </div>
           <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('courseImage')}</CardTitle>
                        <CardDescription>{t('uploadAnImageForYourCourse')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                                                <CloudinaryImageUpload
                            currentImageUrl={imageUrl}
                            onImageUrlChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
                            label={t('courseImage')}
                            description={t('uploadAnImageForYourCourse')}
                            aspectRatio="video"
                            maxSize={5}
                        />
                        {(state?.errors?.imageUrl) && <p className="mt-2 text-sm text-destructive">{state?.errors?.imageUrl}</p>}
                    </CardContent>
                 </Card>
           </div>
        </div>

        <div className="flex justify-between gap-2 mt-6">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="destructive" type="button">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('deleteCourse')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('deleteCourseConfirmation')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCourse} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('delete')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex justify-end gap-2">
                <Link href="/formateur">
                    <Button variant="outline" type="button">
                        {t('cancel')}
                    </Button>
                </Link>
                 <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? t('saving') : t('saveChanges')}
                </Button>
            </div>
        </div>
       </form>
    </div>
  )
}


export default function EditCoursePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'formateur')) {
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
                        <EditCourseForm />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
