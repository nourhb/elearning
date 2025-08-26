'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, User } from 'lucide-react';
import NextImage from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { 
  uploadUserAvatar, 
  uploadFormateurAvatar,
  CloudinaryUploadResult 
} from '@/lib/services/cloudinary';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

interface AvatarUploadProps {
  currentImageUrl: string | null;
  onImageUrlChange: (url: string) => void;
  type: 'user' | 'formateur';
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({
  currentImageUrl,
  onImageUrlChange,
  type,
  label = 'Profile Picture',
  description = 'Upload your profile picture',
  size = 'md'
}: AvatarUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-20 h-20';
      case 'lg':
        return 'w-32 h-32';
      default:
        return 'w-24 h-24';
    }
  };

  const getUploadFunction = () => {
    return type === 'formateur' ? uploadFormateurAvatar : uploadUserAvatar;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      console.log('No file selected or user not authenticated');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        variant: 'destructive', 
        title: 'Invalid File Type', 
        description: 'Please select an image file (JPG, PNG, GIF, WebP).' 
      });
      return;
    }

    // Check file size (limit to 2MB for avatars)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) {
      toast({ 
        variant: 'destructive', 
        title: 'File Too Large', 
        description: 'Please select an image smaller than 2MB.' 
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('=== Starting Avatar upload process ===');
      console.log('User ID:', user.uid);
      console.log('Upload type:', type);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 150);

      // Upload to Cloudinary
      const uploadFunction = getUploadFunction();
      const result: CloudinaryUploadResult = await uploadFunction(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Avatar upload completed successfully');
      console.log('Upload result:', result);

      // Update the form with the new image URL
      onImageUrlChange(result.secure_url);
      
      toast({ 
        title: 'Avatar Updated', 
        description: 'Your profile picture has been updated successfully.' 
      });
      
      console.log('=== Avatar upload process completed successfully ===');
      
    } catch (error: any) {
      console.error('=== Avatar Upload Error Details ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      
      let errorMessage = 'An unknown error occurred during upload.';
      
      if (error.message.includes('413')) {
        errorMessage = 'File too large. Please try a smaller image.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid file format. Please try a different image.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Upload authentication failed. Please check your Cloudinary configuration.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Cloudinary service error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        variant: 'destructive', 
        title: 'Upload Failed', 
        description: errorMessage 
      });
      
      console.error('=== End of Error Details ===');
    } finally {
      console.log('Cleaning up upload state...');
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      console.log('Upload state cleaned up');
    }
  };

  const handleRemoveImage = () => {
    onImageUrlChange('');
    toast({ 
      title: 'Avatar Removed', 
      description: 'Your profile picture has been removed.' 
    });
  };

  const displayPreview = currentImageUrl || DEFAULT_PLACEHOLDER_IMAGE;

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className={`relative ${getSizeClasses()} rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20`}>
          {currentImageUrl ? (
            <>
              <NextImage 
                src={displayPreview} 
                alt="Avatar preview" 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 80px, 96px"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex flex-col gap-1">
                  <Button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                    size="sm"
                    className="bg-white/90 text-black hover:bg-white text-xs"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3 w-3" />
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/90 hover:bg-red-500 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <User className="w-8 h-8 text-muted-foreground mb-2" />
              {isUploading && (
                <div className="w-full">
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!currentImageUrl && !isUploading && (
          <Button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline"
            size="sm"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Choose Image
          </Button>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        disabled={isUploading}
      />
      
      {isUploading && (
        <div className="text-sm text-muted-foreground text-center">
          Uploading avatar... Please wait.
        </div>
      )}
      
      <div className="text-xs text-muted-foreground text-center">
        Supported formats: JPG, PNG, GIF, WebP. Max size: 2MB.
      </div>
    </div>
  );
}
