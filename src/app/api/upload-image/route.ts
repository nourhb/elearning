export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Server-side upload with file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Try different approaches for Cloudinary upload
    const approaches = [
      // Approach 1: No upload preset
      async () => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('cloud_name', 'dnvnkytw5');
        
        const response = await fetch('https://api.cloudinary.com/v1_1/dnvnkytw5/image/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, url: data.secure_url, method: 'no-preset' };
        }
        throw new Error(`Failed: ${response.status}`);
      },
      
      // Approach 2: Try with 'unsigned' preset
      async () => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'unsigned');
        formData.append('cloud_name', 'dnvnkytw5');
        
        const response = await fetch('https://api.cloudinary.com/v1_1/dnvnkytw5/image/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, url: data.secure_url, method: 'unsigned-preset' };
        }
        throw new Error(`Failed: ${response.status}`);
      }
    ];

    // Try each approach
    for (const approach of approaches) {
      try {
        const result = await approach();
        if (result.success) {
          console.log(`✅ Upload successful with method: ${result.method}`);
          return NextResponse.json({ 
            success: true, 
            url: result.url,
            method: result.method
          });
        }
      } catch (error) {
        console.log(`❌ Approach failed: ${error.message}`);
        continue;
      }
    }

    // If all approaches fail, return error
    return NextResponse.json({ 
      error: 'All upload approaches failed',
      message: 'Cloudinary upload is not configured properly. Please check your Cloudinary settings.'
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error.message 
    }, { status: 500 });
  }
}
