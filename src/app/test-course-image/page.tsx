'use client';

import { useState } from 'react';
import { CloudinaryImageUpload } from '@/components/dashboard/cloudinary-image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';

export default function TestCourseImagePage() {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Course Image Upload Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Component</CardTitle>
          </CardHeader>
          <CardContent>
            <CloudinaryImageUpload
              currentImageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              label="Test Course Image"
              description="Upload a test image for course"
              aspectRatio="video"
              maxSize={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <NextImage
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No image selected
                  </div>
                )}
              </div>
              
              <div className="text-sm">
                <p><strong>Image URL:</strong></p>
                <p className="break-all bg-gray-100 p-2 rounded text-xs">
                  {imageUrl || 'No URL'}
                </p>
                
                <p className="mt-2"><strong>URL Type:</strong></p>
                <p className="text-xs">
                  {imageUrl.startsWith('data:') ? 'Data URL (Embedded)' : 
                   imageUrl.includes('res.cloudinary.com') ? 'Cloudinary URL' :
                   imageUrl.startsWith('blob:') ? 'Blob URL (Temporary)' :
                   imageUrl ? 'Other URL' : 'No URL'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
