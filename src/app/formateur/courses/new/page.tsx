
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
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
import { createCourseAction } from './actions';
import { CloudinaryImageUpload } from '@/components/dashboard/cloudinary-image-upload';


function CreateCourseForm() {
  const router = useRouter();
  const { user, services } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const [state, formAction, isSubmitting] = useActionState(createCourseAction, null);

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{ title: string; description: string; imageUrl: string; category: string; level: string; modules: { title: string }[] }>({
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      category: 'programming',
      level: 'beginner',
      modules: [{ title: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'modules',
  });

  const courseTitle = watch('title');

  useEffect(() => {
    if (state?.success) {
      toast({
        title: t('courseCreatedSuccessfully'),
        description: t('newCourseSavedAsDraft'),
      });
      router.push('/formateur');
    } else if (state?.message && !state.errors) {
       toast({
        variant: 'destructive',
        title: t('failedToCreateCourse'),
        description: state.message,
      });
    }
  }, [state, toast, router, t]);


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
      const moduleTitles = result.modules.map(m => ({ title: m.title }));
      setValue('modules', moduleTitles);
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


  return (
    <div className="w-full flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
         <h2 className="text-3xl font-bold tracking-tight">{t('createNewCourse')}</h2>
       </div>
       <form 
        action={formAction}
        className="space-y-6"
       >
        <input type="hidden" name="instructorId" value={user?.uid} />
        <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
                <input type="hidden" {...field} name="imageUrl" />
            )}
        />
        <Controller
            name="modules"
            control={control}
            render={({ field }) => (
                <input 
                    type="hidden" 
                    name="modules" 
                    value={JSON.stringify(field.value)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            field.onChange(parsed);
                        } catch (error) {
                            console.error('Error parsing modules:', error);
                        }
                    }}
                />
            )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>{t('courseDetails')}</CardTitle>
               <CardDescription>{t('fillOutFormToCreateCourse')}</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="title">{t('courseTitle')}</Label>
                   <Controller
                     name="title"
                     control={control}
                     render={({ field }) => <Input id="title" name="title" placeholder={t('e.g. Introduction to AI')} {...field} />}
                   />
                   {(errors.title?.message || state?.errors?.title) && <p className="text-sm text-destructive">{errors.title?.message || state?.errors?.title}</p>}
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description">{t('courseDescription')}</Label>
                   <Controller
                     name="description"
                     control={control}
                     render={({ field }) => (
                       <Textarea
                         id="description"
                         name="description"
                         placeholder={t('describeYourCourse')}
                         className="min-h-[150px]"
                         {...field}
                       />
                     )}
                   />
                   {(errors.description?.message || state?.errors?.description) && <p className="text-sm text-destructive">{errors.description?.message || state?.errors?.description}</p>}
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
                     {(errors.category?.message || state?.errors?.category) && <p className="text-sm text-destructive">{errors.category?.message || state?.errors?.category}</p>}
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
                     {(errors.level?.message || state?.errors?.level) && <p className="text-sm text-destructive">{errors.level?.message || state?.errors?.level}</p>}
                   </div>
                 </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
                <CardTitle>{t('courseModules')}</CardTitle>
                <CardDescription>{t('addModulesToCourse')}</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Controller
                          name={`modules.${index}.title`}
                          control={control}
                          render={({ field: controllerField }) => <Input {...controllerField} placeholder={`${t('module')} ${index + 1} ${t('title')}`} />}
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
                {(errors.modules?.root?.message || state?.errors?.modules) && <p className="text-sm text-destructive">{errors.modules?.root?.message || state?.errors?.modules}</p>}

                <Button type="button" variant="outline" className="w-full mt-4" onClick={() => append({ title: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addModule')}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full mt-2" onClick={handleGenerateModules} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t('generateWithAI')}
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
                    <Controller
                        name="imageUrl"
                        control={control}
                        render={({ field }) => (
                            <CloudinaryImageUpload 
                                currentImageUrl={field.value}
                                onImageUrlChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
                                label={t('courseImage')}
                                description={t('uploadAnImageForYourCourse')}
                                aspectRatio="video"
                                maxSize={5}
                            />
                        )}
                    />
                    {(state?.errors?.imageUrl) && <p className="mt-2 text-sm text-destructive">{state?.errors?.imageUrl}</p>}
                </CardContent>
             </Card>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Link href="/formateur">
              <Button variant="outline" type="button">
                  {t('cancel')}
              </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {isSubmitting ? t('creating') : t('createCourse')}
          </Button>
        </div>
       </form>
    </div>
  )
}


export default function CreateCoursePage() {
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
                        <CreateCourseForm />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
