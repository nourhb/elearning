
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import NextImage from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase'; // Import the initialized firebase app
import { getCourseImageUrl } from '@/lib/utils';


interface ImageUploadProps {
  currentImageUrl: string | null;
  onImageUrlChange: (url: string) => void;
}

export function ImageUpload({
  currentImageUrl,
  onImageUrlChange,
}: ImageUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image file.' });
        return;
    }

    setIsUploading(true);
    
    try {
        const storage = getStorage(app);
        const filePath = `course-images/${user.uid}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, filePath);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        onImageUrlChange(downloadUrl);
        
        toast({ title: 'Upload Successful', description: 'The image has been uploaded.' });
      
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'An unknown error occurred during upload.' });
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const displayPreview = getCourseImageUrl(currentImageUrl);

  return (
    <div className="space-y-4">
      <Label>Course Image</Label>
      <div className="relative w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden">
        <NextImage src={displayPreview} alt="Course preview" layout="fill" objectFit="cover" />
        <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
             <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                    </>
                ) : (
                     <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Change Image
                    </>
                )}
            </Button>
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        disabled={isUploading}
      />
    </div>
  );
}
