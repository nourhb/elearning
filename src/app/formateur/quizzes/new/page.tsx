'use client';

import { useState, useActionState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { createQuizAction } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Course } from '@/lib/types';

type FormData = {
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  questions: {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    points: number;
  }[];
};

function CreateQuizForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, services } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const [state, formAction] = useActionState(createQuizAction, null);

  // Handle form submission result
  useEffect(() => {
    if (state) {
      if (state.success) {
        toast({
          title: "Success!",
          description: state.message || "Quiz created successfully!",
        });
        // Redirect to quizzes page after successful creation
        router.push('/formateur/quizzes');
      } else {
        toast({
          title: "Error",
          description: state.message || "Failed to create quiz. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [state, toast, router]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      courseId: '',
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: user?.role === 'admin' ? 10 : user?.role === 'formateur' ? 5 : 3,
      isActive: true,
      questions: [
        {
          id: `question-${Date.now()}-1`,
          text: 'Enter your question here...',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 0,
          explanation: '',
          points: 1
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions'
  });

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/formateur/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses.filter((c: Course) => c.status === 'Published'));
        } else {
          console.error('Failed to fetch courses:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, [user]);

  const onSubmit = (data: FormData) => {
    // Validate questions before submission
    const validQuestions = data.questions.filter(q => 
      q.text.trim() !== '' && 
      q.options.filter(opt => opt.trim() !== '').length >= 2
    );

    if (validQuestions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one question with text and at least 2 options.",
        variant: "destructive",
      });
      return;
    }

    // Check if any question has empty text or insufficient options
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      if (question.text.trim() === '') {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} must have text.`,
          variant: "destructive",
        });
        return;
      }
      
      const validOptions = question.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} must have at least 2 options.`,
          variant: "destructive",
        });
        return;
      }
    }

    const formData = new FormData();
    formData.set('title', data.title);
    formData.set('description', data.description);
    formData.set('courseId', data.courseId);
    formData.set('timeLimit', data.timeLimit?.toString() || '');
    formData.set('passingScore', data.passingScore.toString());
    formData.set('maxAttempts', data.maxAttempts.toString());
    formData.set('isActive', data.isActive.toString());
    formData.set('questions', JSON.stringify(data.questions));
    formData.set('createdBy', user?.uid || '');

    startTransition(() => {
      formAction(formData);
    });
  };

  const addQuestion = () => {
    append({
      id: `question-${Date.now()}-${fields.length + 1}`,
      text: 'Enter your question here...',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
      explanation: '',
      points: 1
    });
  };

  const removeQuestion = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = watch(`questions.${questionIndex}.options`);
    if (currentOptions.length < 6) {
      setValue(`questions.${questionIndex}.options`, [...currentOptions, '']);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = watch(`questions.${questionIndex}.options`);
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, index) => index !== optionIndex);
      setValue(`questions.${questionIndex}.options`, newOptions);
      
      // Adjust correct answer if needed
      const currentCorrect = watch(`questions.${questionIndex}.correctAnswer`);
      if (currentCorrect >= optionIndex) {
        setValue(`questions.${questionIndex}.correctAnswer`, Math.max(0, currentCorrect - 1));
      }
    }
  };

  return (
    <div className="w-full flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create New Quiz</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General error message */}
        {state?.message && !state?.success && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <p className="text-sm text-destructive">{state.message}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Information</CardTitle>
                <CardDescription>Basic details about your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter quiz title"
                  />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                  {state?.errors?.title && <p className="text-sm text-destructive mt-1">{state.errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    placeholder="Describe what this quiz covers"
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                  {state?.errors?.description && <p className="text-sm text-destructive mt-1">{state.errors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="courseId">Course</Label>
                  <Select 
                    onValueChange={(value) => setValue('courseId', value)}
                    value={watch('courseId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input 
                    type="hidden" 
                    {...register('courseId', { required: 'Course is required' })}
                  />
                  {errors.courseId && <p className="text-sm text-destructive mt-1">{errors.courseId.message}</p>}
                  {state?.errors?.courseId && <p className="text-sm text-destructive mt-1">{state.errors.courseId}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add questions to your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, questionIndex) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Question {questionIndex + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        {...register(`questions.${questionIndex}.text` as const, { required: 'Question text is required' })}
                        placeholder="Enter your question"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {watch(`questions.${questionIndex}.options`).map((_, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Checkbox
                              checked={watch(`questions.${questionIndex}.correctAnswer`) === optionIndex}
                              onCheckedChange={() => setValue(`questions.${questionIndex}.correctAnswer`, optionIndex)}
                            />
                            <Input
                              {...register(`questions.${questionIndex}.options.${optionIndex}` as const, { required: 'Option text is required' })}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="flex-1"
                            />
                            {watch(`questions.${questionIndex}.options`).length > 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {watch(`questions.${questionIndex}.options`).length < 6 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(questionIndex)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          {...register(`questions.${questionIndex}.points` as const, { 
                            required: 'Points are required',
                            min: { value: 1, message: 'Minimum 1 point' }
                          })}
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Explanation (Optional)</Label>
                      <Textarea
                        {...register(`questions.${questionIndex}.explanation` as const)}
                        placeholder="Explain why this is the correct answer"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>Configure quiz parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    {...register('timeLimit', { min: { value: 1, message: 'Minimum 1 minute' } })}
                    placeholder="30"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for no time limit</p>
                  {errors.timeLimit && <p className="text-sm text-destructive mt-1">{errors.timeLimit.message}</p>}
                  {state?.errors?.timeLimit && <p className="text-sm text-destructive mt-1">{state.errors.timeLimit}</p>}
                </div>

                <div>
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    {...register('passingScore', { 
                      required: 'Passing score is required',
                      min: { value: 1, message: 'Minimum 1%' },
                      max: { value: 100, message: 'Maximum 100%' }
                    })}
                    placeholder="70"
                    min="1"
                    max="100"
                  />
                  {errors.passingScore && <p className="text-sm text-destructive mt-1">{errors.passingScore.message}</p>}
                  {state?.errors?.passingScore && <p className="text-sm text-destructive mt-1">{state.errors.passingScore}</p>}
                </div>

                <div>
                  <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    {...register('maxAttempts', { 
                      required: 'Max attempts is required',
                      min: { value: 1, message: 'Minimum 1 attempt' },
                      max: { 
                        value: user?.role === 'admin' ? 20 : user?.role === 'formateur' ? 15 : 5, 
                        message: `Maximum ${user?.role === 'admin' ? 20 : user?.role === 'formateur' ? 15 : 5} attempts for ${user?.role} role` 
                      }
                    })}
                    placeholder={user?.role === 'admin' ? '10' : user?.role === 'formateur' ? '5' : '3'}
                    min="1"
                    max={user?.role === 'admin' ? 20 : user?.role === 'formateur' ? 15 : 5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.role === 'admin' && 'Admin: Up to 20 attempts allowed'}
                    {user?.role === 'formateur' && 'Instructor: Up to 15 attempts allowed'}
                    {user?.role === 'student' && 'Student: Up to 5 attempts allowed'}
                  </p>
                  {errors.maxAttempts && <p className="text-sm text-destructive mt-1">{errors.maxAttempts.message}</p>}
                  {state?.errors?.maxAttempts && <p className="text-sm text-destructive mt-1">{state.errors.maxAttempts}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={watch('isActive')}
                    onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
                  />
                  <Label htmlFor="isActive">Active Quiz</Label>
                </div>
                <p className="text-xs text-muted-foreground">Active quizzes are available to students</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/formateur">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <CreateQuizForm />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
