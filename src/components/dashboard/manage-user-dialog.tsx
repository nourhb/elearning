
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Course } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { updateUserAction, deleteUser, getUserManagementData } from '@/app/admin/actions';
import { Loader2, Trash2, ChevronsUpDown } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';


interface ManageUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile;
  onUserUpdate: () => void;
}

interface FormValues {
    role: 'admin' | 'formateur' | 'student';
    status: 'active' | 'suspended';
    courseIds: string[];
}

export function ManageUserDialog({ isOpen, setIsOpen, user, onUserUpdate }: ManageUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      role: user.role,
      status: user.status || 'active',
      courseIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
        setDataLoading(true);
        const fetchData = async () => {
            try {
                // Call the server action to get all necessary data
                const { allCourses, assignedCourseIds } = await getUserManagementData(user.uid);
                
                setCourses(allCourses);

                reset({
                    role: user.role,
                    status: user.status || 'active',
                    courseIds: assignedCourseIds,
                });

            } catch (error) {
                console.error("Failed to fetch user management data:", error);
                toast({ variant: "destructive", title: t('error'), description: t('failedToFetchUserData') });
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }
  }, [user, isOpen, reset, t, toast]);
  

  const currentStatus = watch('status');
  const selectedCourseIds = watch('courseIds', []);

  const handleFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
        await updateUserAction({
            uid: user.uid,
            ...data
        });

        toast({
            title: t('userUpdated'),
            description: t('userProfileHasBeenSuccessfullyUpdated'),
        });
        onUserUpdate();
        setIsOpen(false);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: t('updateFailed'),
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
        const result = await deleteUser(user.uid);
        if (result.success) {
            toast({
                title: t('userDeleted'),
                description: `${user.displayName} ${t('hasBeenPermanentlyRemoved')}`
            });
            onUserUpdate();
            setIsOpen(false);
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: t('deleteFailed'),
            description: error.message || t('anErrorOccurredWhileDeletingTheUser')
        });
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('manage')} {user.displayName}</DialogTitle>
          <DialogDescription>{t('updateUserRoleStatusAndCourses')}</DialogDescription>
        </DialogHeader>
        {dataLoading ? <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
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
                                    <SelectItem value="admin">{t('admin')}</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="space-y-2">
                     <Label>{t('accountStatus')}</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2 rounded-lg border p-3">
                                <Switch
                                    id="status-switch"
                                    checked={field.value === 'active'}
                                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'suspended')}
                                />
                                <Label htmlFor="status-switch" className="flex-grow">
                                    {t(currentStatus)}
                                </Label>
                            </div>
                        )}
                    />
                </div>

                {user.role === 'student' && (
                    <div className="space-y-2">
                        <Label>{t('assignedCourses')}</Label>
                        <Controller
                            name="courseIds"
                            control={control}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} ${t('coursesSelected')}` : t('selectCourses')}
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


                <DialogFooter className="justify-between sm:justify-between w-full pt-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" type="button">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('deleteUser')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                               {t('deleteUserConfirmation', { userName: user.displayName })}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('delete')}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? t('saving') : t('saveChanges')}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

