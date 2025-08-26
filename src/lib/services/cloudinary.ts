import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  bytes: number;
  original_filename?: string;
}

export type UploadFolder = 'course-images' | 'user-avatars' | 'formateur-avatars' | 'community-posts';

export async function uploadToCloudinary(
  file: File,
  folder: UploadFolder = 'community-posts',
  options: {
    transformation?: string;
    quality?: number;
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  // Check if Cloudinary is configured
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary not configured. Using local file URL as fallback.');
    return createLocalFileResult(file);
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    
    // Add transformation options
    if (options.transformation) {
      formData.append('transformation', options.transformation);
    }
    if (options.quality) {
      formData.append('quality', options.quality.toString());
    }
    if (options.format) {
      formData.append('format', options.format);
    }

    console.log('Uploading to Cloudinary:', {
      cloudName,
      uploadPreset,
      folder,
      fileName: file.name,
      fileSize: file.size
    });

    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve({
            public_id: data.public_id,
            secure_url: data.secure_url,
            width: data.width,
            height: data.height,
            format: data.format,
            resource_type: data.resource_type,
            bytes: data.bytes,
            original_filename: data.original_filename,
          });
        }
      })
      .catch(error => {
        console.error('Cloudinary upload error:', error);
        reject(error);
      });
  });
}

export async function uploadMultipleToCloudinary(
  files: File[],
  folder: UploadFolder = 'community-posts',
  options: {
    transformation?: string;
    quality?: number;
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary not configured. Using local file URLs as fallback.');
    return files.map(file => createLocalFileResult(file));
  }
  
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder, options));
  return Promise.all(uploadPromises);
}

// Fallback function for when Cloudinary is not configured
function createLocalFileResult(file: File): CloudinaryUploadResult {
  const fileId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fileType = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'file';
  
  // Create a more persistent blob URL
  const blobUrl = URL.createObjectURL(file);
  
  // Store the blob URL in a global cache to prevent garbage collection
  if (typeof window !== 'undefined') {
    if (!window.__blobUrlCache) {
      window.__blobUrlCache = new Map();
    }
    window.__blobUrlCache.set(fileId, { url: blobUrl, file });
  }
  
  return {
    public_id: fileId,
    secure_url: blobUrl,
    width: fileType === 'image' ? 800 : undefined,
    height: fileType === 'image' ? 600 : undefined,
    format: file.name.split('.').pop() || 'unknown',
    resource_type: fileType,
    bytes: file.size,
    original_filename: file.name,
  };
}

// Add TypeScript declaration for the global cache
declare global {
  interface Window {
    __blobUrlCache?: Map<string, { url: string; file: File }>;
  }
}

export function getCloudinaryUrl(publicId: string, options: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: number;
  format?: string;
  gravity?: string;
  radius?: number;
} = {}): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('Cloudinary not configured. Returning original URL.');
    return publicId;
  }
  
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.radius) transformations.push(`r_${options.radius}`);
  
  const transformString = transformations.length > 0 ? transformations.join(',') + '/' : '';
  
  return `${baseUrl}/${transformString}${publicId}`;
}

// Specialized upload functions for different use cases
export async function uploadCourseImage(file: File): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'course-images', {
    transformation: 'w_800,h_600,c_fill,q_auto,f_auto',
    quality: 80,
    format: 'auto'
  });
}

export async function uploadUserAvatar(file: File): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'user-avatars', {
    transformation: 'w_200,h_200,c_fill,g_face,q_auto,f_auto',
    quality: 85,
    format: 'auto'
  });
}

export async function uploadFormateurAvatar(file: File): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'formateur-avatars', {
    transformation: 'w_300,h_300,c_fill,g_face,q_auto,f_auto',
    quality: 85,
    format: 'auto'
  });
}

// Utility function to validate and fix blob URLs
export function validateBlobUrl(url: string): string {
  if (!url) {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }
  
  if (url.startsWith('blob:')) {
    // For blob URLs, we'll return a placeholder if there's an issue
    // The actual validation will be handled by the Image component's onError
    return url;
  }
  
  // For other URLs, return as-is
  return url;
}

// Utility function to cleanup blob URLs
export function cleanupBlobUrl(publicId: string): void {
  if (typeof window !== 'undefined' && window.__blobUrlCache) {
    const cached = window.__blobUrlCache.get(publicId);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      window.__blobUrlCache.delete(publicId);
    }
  }
}

// Utility function to get optimized image URL
export function getOptimizedImageUrl(publicId: string, type: 'course' | 'avatar' | 'formateur' = 'course'): string {
  // If it's a local blob URL, return it as-is
  if (publicId.startsWith('blob:') || publicId.startsWith('local_')) {
    return validateBlobUrl(publicId);
  }
  
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('Cloudinary not configured. Returning original URL.');
    return publicId;
  }
  
  switch (type) {
    case 'course':
      return getCloudinaryUrl(publicId, { width: 800, height: 600, crop: 'fill', quality: 80 });
    case 'avatar':
      return getCloudinaryUrl(publicId, { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 85 });
    case 'formateur':
      return getCloudinaryUrl(publicId, { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 85 });
    default:
      return getCloudinaryUrl(publicId, { quality: 80 });
  }
}
