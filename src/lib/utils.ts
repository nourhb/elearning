import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Course } from "./types";
import { DEFAULT_PLACEHOLDER_IMAGE, COURSE_PLACEHOLDER_IMAGES } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A centralized utility function to get a guaranteed valid image URL for a course.
 * If the course's imageUrl is missing, empty, or an old placeholder,
 * it returns the local fallback placeholder image.
 * @param course - The course object or just the imageUrl string.
 * @returns A string with a valid image path.
 */
export function getCourseImageUrl(course: Pick<Course, 'imageUrl' | 'title'> | string | null | undefined): string {
    if (!course) {
        return DEFAULT_PLACEHOLDER_IMAGE;
    }

    const imageUrl = typeof course === 'string' ? course : course.imageUrl;
    const courseTitle = typeof course === 'string' ? '' : course.title?.toLowerCase() || '';

    // Helper function to get course-specific placeholder
    const getCourseSpecificPlaceholder = () => {
        // For now, use the default placeholder to avoid SVG loading issues
        return DEFAULT_PLACEHOLDER_IMAGE;
        
        // TODO: Re-enable course-specific placeholders once SVG loading issues are resolved
        /*
        if (courseTitle.includes('ai') || courseTitle.includes('artificial intelligence')) {
            return COURSE_PLACEHOLDER_IMAGES.ai;
        } else if (courseTitle.includes('react')) {
            return COURSE_PLACEHOLDER_IMAGES.react;
        } else if (courseTitle.includes('python') || courseTitle.includes('data science')) {
            return COURSE_PLACEHOLDER_IMAGES.python;
        } else if (courseTitle.includes('next') || courseTitle.includes('nextjs')) {
            return COURSE_PLACEHOLDER_IMAGES.nextjs;
        } else if (courseTitle.includes('cyber') || courseTitle.includes('security')) {
            return COURSE_PLACEHOLDER_IMAGES.cyber;
        } else if (courseTitle.includes('ux') || courseTitle.includes('design')) {
            return COURSE_PLACEHOLDER_IMAGES.ux;
        }
        
        return DEFAULT_PLACEHOLDER_IMAGE;
        */
    };

    // If no image URL or it's empty, use placeholder
    if (!imageUrl || imageUrl.trim() === '') {
        return getCourseSpecificPlaceholder();
    }

    // Check if it's a Cloudinary URL (these should be preserved)
    if (imageUrl.includes('res.cloudinary.com')) {
        return imageUrl;
    }

    // Check if it's a data URL (embedded image, should be preserved)
    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    // Check if it's a blob URL (temporary, will become invalid)
    if (imageUrl.startsWith('blob:')) {
        // Blob URLs are temporary and become invalid on page refresh
        // Replace them with placeholder images
        return getCourseSpecificPlaceholder();
    }

    // If the image URL contains placeholder or is corrupted, use course-specific placeholder
    if (imageUrl.includes('placehold.co') || imageUrl.includes('placeholder')) {
        return getCourseSpecificPlaceholder();
    }

    // If it's already a valid placeholder image (without cache-busting), keep it
    if (imageUrl === DEFAULT_PLACEHOLDER_IMAGE || imageUrl.startsWith(DEFAULT_PLACEHOLDER_IMAGE + '?')) {
        return imageUrl;
    }

    return imageUrl;
}
