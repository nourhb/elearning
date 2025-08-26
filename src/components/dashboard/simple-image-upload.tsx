'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

interface SimpleImageUploadProps {
  currentImageUrl: string | null;
  onImageUrlChange: (url: string) => void;
  label?: string;
  description?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  maxSize?: number; // in MB
}

export function SimpleImageUpload({
  currentImageUrl,
  onImageUrlChange,
  label = 'Image',
  description = 'Upload an image',
  aspectRatio = 'auto',
  maxSize = 5
}: SimpleImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return 'aspect-auto';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
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

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast({ 
        variant: 'destructive', 
        title: 'File Too Large', 
        description: `Please select an image smaller than ${maxSize}MB.` 
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('=== Starting simple upload process ===');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create a local URL for the file (for demo purposes)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload time
      
      const localUrl = URL.createObjectURL(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload completed successfully');
      console.log('Local URL created:', localUrl);

      // Update the form with the local URL
      onImageUrlChange(localUrl);
      
      toast({ 
        title: 'Upload Successful', 
        description: 'The image has been uploaded successfully (local preview).' 
      });
      
      console.log('=== Upload process completed successfully ===');
      
    } catch (error: any) {
      console.error('=== Upload Error Details ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      
      toast({ 
        variant: 'destructive', 
        title: 'Upload Failed', 
        description: 'An error occurred during upload. Please try again.' 
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
      title: 'Image Removed', 
      description: 'The image has been removed.' 
    });
  };

  const [displayPreview, setDisplayPreview] = useState(currentImageUrl || DEFAULT_PLACEHOLDER_IMAGE);

  // Update displayPreview when currentImageUrl changes
  React.useEffect(() => {
    setDisplayPreview(currentImageUrl || DEFAULT_PLACEHOLDER_IMAGE);
  }, [currentImageUrl]);

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className={`relative w-full ${getAspectRatioClass()} rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20`}>
        {currentImageUrl ? (
          <>
            <NextImage 
              src={displayPreview} 
              alt="Preview" 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => {
                // If the image fails to load (like a blob URL), show placeholder
                setDisplayPreview(DEFAULT_PLACEHOLDER_IMAGE);
              }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                size="sm"
                className="bg-white/90 text-black hover:bg-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Change
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                onClick={handleRemoveImage}
                disabled={isUploading}
                size="sm"
                variant="destructive"
                className="bg-red-500/90 hover:bg-red-500"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {isUploading ? 'Uploading...' : 'No image selected'}
            </p>
            {isUploading ? (
              <div className="w-full max-w-xs">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
              </div>
            ) : (
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
        <div className="text-sm text-muted-foreground">
          Uploading image... Please wait.
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, GIF, WebP. Max size: {maxSize}MB.
        <br />
        <span className="text-orange-600 font-medium">
          ⚠️ Note: This is a local preview only. Blob URLs will be replaced with placeholder images when saved.
        </span>
      </div>
    </div>
  );
}
