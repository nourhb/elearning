
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, Shield, GraduationCap, User } from 'lucide-react';
import { getAllCourses } from '@/lib/services/courses';
import type { Course } from '@/lib/types';
import { createUserAndAssignCoursesAction } from '@/app/admin/actions';
import { 
  canCreateRole, 
  getCreatableRoles, 
  validateRoleAssignment, 
  ROLE_INFO,
  type UserRole 
} from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onUserCreated: () => void;
  creatorId: string;
  creatorRole: UserRole;
}

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  courseIds: string[];
}

export function CreateUserDialog({ isOpen, setIsOpen, onUserCreated, creatorId, creatorRole }: CreateUserDialogProps) {
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
      role: 'student', // Default to student for security
      courseIds: [],
    },
  });

  const selectedCourseIds = watch('courseIds');
  const selectedRole = watch('role');
  const { t } = useTranslation();

  // Get available roles that the creator can create
  const availableRoles = getCreatableRoles(creatorRole);

  useEffect(() => {
    async function fetchCourses() {
      if (services?.db) {
        try {
          const allCourses = await getAllCourses(services.db);
          const publishedCourses = allCourses.filter(c => c.status === 'Published');
          setCourses(publishedCourses);
          
          if (publishedCourses.length === 0) {
            console.log('No published courses found in database');
          }
        } catch (error: any) {
          console.error('Failed to fetch courses:', error);
          if (error.message && !error.message.includes('permission')) {
            toast({ variant: 'destructive', title: t('error'), description: t('failedToFetchCourses') });
          }
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

  // Validate role selection when it changes
  useEffect(() => {
    if (selectedRole) {
      const validation = validateRoleAssignment(creatorRole, selectedRole);
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Invalid Role Selection',
          description: validation.message,
        });
        // Reset to a valid role
        reset({ ...watch(), role: 'student' });
      }
    }
  }, [selectedRole, creatorRole, toast, reset, watch]);

  const onSubmit = async (data: FormValues) => {
    // Validate role assignment before submission
    const validation = validateRoleAssignment(creatorRole, data.role);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Role Assignment',
        description: validation.message,
      });
      return;
    }

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

      if (result?.message && !result.errors) {
        toast({
          title: 'Success',
          description: result.message,
        });
        onUserCreated();
        setIsOpen(false);
      } else {
        setState(result);
        if (result?.message) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message,
          });
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create user. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account with appropriate role and course assignments.
          </DialogDescription>
        </DialogHeader>

        {/* Role Permissions Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Role Permissions:</strong> You can create users with the following roles: {' '}
            {availableRoles.map((role, index) => (
              <span key={role}>
                <Badge variant="outline" className="mx-1">
                  {getRoleIcon(role)}
                  {ROLE_INFO[role].label}
                </Badge>
                {index < availableRoles.length - 1 ? ' ' : ''}
              </span>
            ))}
            {creatorRole === 'admin' && (
              <div className="mt-2 text-xs">
                <strong>Full Access:</strong> As an administrator, you have complete control and can create users of any role.
              </div>
            )}
          </AlertDescription>
        </Alert>

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
              rules={{ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }}
              render={({ field }) => <Input id="email" type="email" {...field} />}
            />
            {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Controller
              name="password"
              control={control}
              rules={{ required: true, minLength: 6 }}
              render={({ field }) => <Input id="password" type="password" {...field} />}
            />
            {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password}</p>}
          </div>

          {/* Role Selection with Permissions */}
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
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          <div className="flex flex-col">
                            <span className="font-medium">{ROLE_INFO[role].label}</span>
                            <span className="text-xs text-muted-foreground">
                              {ROLE_INFO[role].description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {state?.errors?.role && <p className="text-sm text-destructive">{state.errors.role}</p>}
          </div>

          {/* Course Assignment (only for students) */}
          {selectedRole === 'student' && (
            <div className="space-y-2">
              <Label>{t('assignCourses')}</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No published courses available</p>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Controller
                        name="courseIds"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={course.id}
                            checked={selectedCourseIds.includes(course.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...selectedCourseIds, course.id]);
                              } else {
                                field.onChange(selectedCourseIds.filter(id => id !== course.id));
                              }
                            }}
                          />
                        )}
                      />
                      <Label htmlFor={course.id} className="text-sm cursor-pointer">
                        {course.title}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {state?.message && !state.errors && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
