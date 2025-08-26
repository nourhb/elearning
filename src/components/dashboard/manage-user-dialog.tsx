
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
import { Loader2, AlertCircle, Shield, GraduationCap, User, Eye, EyeOff } from 'lucide-react';
import { getAllCourses } from '@/lib/services/courses';
import type { Course, UserProfile } from '@/lib/types';
import { changeUserPasswordAction, updateUserAction } from '@/app/admin/actions';
import { 
  canManageRole, 
  canDeleteRole, 
  canSuspendRole,
  getManageableRoles, 
  validateRoleAssignment, 
  ROLE_INFO,
  type UserRole 
} from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface ManageUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: UserProfile;
  onUserUpdate: () => void;
}

interface FormValues {
  role: UserRole;
  status: 'active' | 'suspended';
  courseIds: string[];
}

export function ManageUserDialog({ isOpen, setIsOpen, user, onUserUpdate }: ManageUserDialogProps) {
  const { toast } = useToast();
  const { services } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { t } = useTranslation();

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      role: user.role,
      status: user.status,
      courseIds: [],
    },
  });

  const selectedRole = watch('role');
  const selectedStatus = watch('status');

  // Get current user's role for permission checking
  const currentUser = useAuth().user;
  const currentUserRole = currentUser?.role as UserRole;

  // Get available roles that the current user can manage
  const manageableRoles = getManageableRoles(currentUserRole);

  useEffect(() => {
    async function fetchCourses() {
      if (services?.db) {
        try {
          setDataLoading(true);
          const allCourses = await getAllCourses(services.db);
          const publishedCourses = allCourses.filter(c => c.status === 'Published');
          setCourses(publishedCourses);
        } catch (error) {
          console.error('Failed to fetch courses:', error);
        } finally {
          setDataLoading(false);
        }
      }
    }
    if (isOpen) {
      fetchCourses();
      // Reset form with current user data
      reset({
        role: user.role,
        status: user.status,
        courseIds: [],
      });
    }
  }, [isOpen, services?.db, user, reset]);

  // Validate role changes
  useEffect(() => {
    if (selectedRole && selectedRole !== user.role) {
      const validation = validateRoleAssignment(currentUserRole, selectedRole);
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Invalid Role Assignment',
          description: validation.message,
        });
        // Reset to original role
        setValue('role', user.role);
      }
    }
  }, [selectedRole, user.role, currentUserRole, toast, setValue]);

  const handleFormSubmit = async (data: FormValues) => {
    // Validate role assignment before submission
    if (data.role !== user.role) {
      const validation = validateRoleAssignment(currentUserRole, data.role);
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Invalid Role Assignment',
          description: validation.message,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await updateUserAction({
        uid: user.uid,
        role: data.role,
        status: data.status,
        courseIds: data.courseIds,
        updaterId: currentUser?.uid || '',
      });

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      onUserUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters long',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      await changeUserPasswordAction(user.uid, newPassword);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to change password. Please try again.',
      });
    } finally {
      setIsChangingPassword(false);
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

  const canManageThisUser = canManageRole(currentUserRole, user.role);
  const canDeleteThisUser = canDeleteRole(currentUserRole, user.role);
  const canSuspendThisUser = canSuspendRole(currentUserRole, user.role);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User: {user.displayName}</DialogTitle>
          <DialogDescription>
            Update user role, status, and course assignments.
          </DialogDescription>
        </DialogHeader>

        {/* Permission Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Your Permissions:</strong> You can manage users with the following roles: {' '}
            {manageableRoles.map((role, index) => (
              <span key={role}>
                <Badge variant="outline" className="mx-1">
                  {getRoleIcon(role)}
                  {ROLE_INFO[role].label}
                </Badge>
                {index < manageableRoles.length - 1 ? ' ' : ''}
              </span>
            ))}
            {currentUserRole === 'admin' && (
              <div className="mt-2 text-xs">
                <strong>Complete Control:</strong> As an administrator, you can manage, delete, and suspend any user, including other administrators.
              </div>
            )}
          </AlertDescription>
        </Alert>

        {dataLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
            {/* User Info Display */}
            <div className="space-y-2">
              <Label>User Information</Label>
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{user.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Role:</span>
                  <Badge variant="outline">
                    {getRoleIcon(user.role)}
                    {ROLE_INFO[user.role].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Role Management */}
            {canManageThisUser && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {manageableRoles.map((role) => (
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
              </div>
            )}

            {/* Status Management */}
            {canSuspendThisUser && (
              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedStatus === 'active'}
                    onCheckedChange={(checked) => setValue('status', checked ? 'active' : 'suspended')}
                  />
                  <span className="text-sm">
                    {selectedStatus === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedStatus === 'active' 
                    ? 'User can access the platform normally' 
                    : 'User will be blocked from accessing the platform'
                  }
                </p>
              </div>
            )}

            {/* Course Assignment (only for students) */}
            {selectedRole === 'student' && (
              <div className="space-y-2">
                <Label>Assign Courses</Label>
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
                              checked={field.value?.includes(course.id) || false}
                              onCheckedChange={(checked) => {
                                const currentIds = field.value || [];
                                if (checked) {
                                  field.onChange([...currentIds, course.id]);
                                } else {
                                  field.onChange(currentIds.filter(id => id !== course.id));
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

            {/* Password Change Section */}
            <div className="space-y-4 border-t pt-4">
              <Label>Change Password</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

