
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { getAllCourses } from '@/lib/services/courses';
import { useAuth } from '@/hooks/use-auth';
import { createUserAndAssignCoursesAction } from '@/app/admin/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown } from 'lucide-react';

interface CreateUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onUserCreated: () => void;
  creatorId: string;
  creatorRole: 'admin' | 'formateur';
}

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'student' | 'formateur';
  courseIds: string[];
}

export function CreateUserDialog({ isOpen, setIsOpen, onUserCreated, creatorId, creatorRole }: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { services } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [state, setState] = useState<{ message?: string, errors?: any } | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      courseIds: [],
    },
  });

  const selectedCourseIds = watch('courseIds');
  const role = watch('role');

  useEffect(() => {
    async function fetchCourses() {
      if (services?.db) {
        try {
          const allCourses = await getAllCourses(services.db);
          setCourses(allCourses.filter(c => c.status === 'Published'));
        } catch (error) {
          console.error('Failed to fetch courses:', error);
          toast({ variant: 'destructive', title: t('error'), description: t('failedToFetchCourses') });
        }
      }
    }
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen, services?.db, t, toast]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
        reset();
        setState(null);
    }
  }, [isOpen, reset]);


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setState(null);
    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('role', data.role);
      formData.append('courseIds', JSON.stringify(data.courseIds));
      formData.append('creatorId', creatorId);
      
      const result = await createUserAndAssignCoursesAction(null, formData);
      
      if(result.success) {
        toast({
            title: t('userCreated'),
            description: t('accountHasBeenSuccessfullyCreated'),
        });
        onUserCreated();
        setIsOpen(false);
      } else {
        setState(result);
        if (result.message && !result.errors) {
            toast({
                variant: 'destructive',
                title: t('creationFailed'),
                description: result.message,
            });
        }
      }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: t('creationFailed'),
            description: error.message || t('anErrorOccurredWhileCreatingTheUser'),
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('createUserAccount')}</DialogTitle>
          <DialogDescription>{t('fillDetailsToCreateUser')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')}</Label>
                <Controller
                    name="firstName"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <Input id="firstName" {...field} />}
                />
                 {state?.errors?.firstName && <p className="text-sm text-destructive">{state.errors.firstName}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')}</Label>
                <Controller
                    name="lastName"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <Input id="lastName" {...field} />}
                />
                {state?.errors?.lastName && <p className="text-sm text-destructive">{state.errors.lastName}</p>}
            </div>
          </div>
           <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Controller
                    name="email"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <Input id="email" type="email" {...field} />}
                />
                {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                 <Controller
                    name="password"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <Input id="password" type="password" {...field} />}
                />
                {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password}</p>}
            </div>
            {creatorRole === 'admin' && (
                <div className="space-y-2">
                    <Label htmlFor="role">{t('role')}</Label>
                     <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectARole')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">{t('student')}</SelectItem>
                                    <SelectItem value="formateur">{t('formateur')}</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            )}
            {role === 'student' && (
                <div className="space-y-2">
                    <Label>{t('assignCourses')}</Label>
                     <Controller
                        name="courseIds"
                        control={control}
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} ${t('coursesSelected')}` : t('selectCoursesOptional')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder={t('searchCourses')} />
                                        <CommandList>
                                            <CommandEmpty>{t('noCoursesFound')}</CommandEmpty>
                                            <CommandGroup>
                                                {courses.map(course => (
                                                    <CommandItem
                                                        key={course.id}
                                                        value={course.title}
                                                        onSelect={() => {
                                                            const currentIds = field.value || [];
                                                            const newIds = currentIds.includes(course.id)
                                                                ? currentIds.filter(id => id !== course.id)
                                                                : [...currentIds, course.id];
                                                            field.onChange(newIds);
                                                        }}
                                                    >
                                                        <Checkbox
                                                            className="mr-2"
                                                            checked={field.value?.includes(course.id)}
                                                        />
                                                        {course.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                </div>
            )}
            {state?.message && !state.errors && <p className="text-sm text-destructive">{state.message}</p>}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('creating') : t('createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
