'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { useAuth } from '@/hooks/use-auth';

interface ProfileFormData {
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
}

export function ProfileFormExample() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.displayName || '',
      email: user?.email || '',
      avatarUrl: user?.photoURL || '',
      bio: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would typically update the user profile in your database
      console.log('Profile data to save:', data);
      
      // Example API call
      // await updateUserProfile(data);
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your profile information and avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <Controller
              name="avatarUrl"
              control={control}
              render={({ field }) => (
                <AvatarUpload
                  currentImageUrl={field.value}
                  onImageUrlChange={(url) => setValue('avatarUrl', url)}
                  type={user?.role === 'formateur' ? 'formateur' : 'user'}
                  label="Profile Picture"
                  description="Upload a profile picture (recommended: square image, max 2MB)"
                  size="lg"
                />
              )}
            />

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...field}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                rules={{ 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                }}
                render={({ field }) => (
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                  />
                )}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Bio Field */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    {...field}
                  />
                )}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Updating Profile...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
