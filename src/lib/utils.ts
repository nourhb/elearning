import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Course } from "./types";

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
export function getCourseImageUrl(course: Pick<Course, 'imageUrl'> | string | null | undefined): string {
    const fallbackImage = '/Countries-page-image-placeholder-800x500.webp';
    
    if (!course) {
        return fallbackImage;
    }

    const imageUrl = typeof course === 'string' ? course : course.imageUrl;

    if (!imageUrl || imageUrl.trim() === '' || imageUrl.includes('placehold.co')) {
        return fallbackImage;
    }

    return imageUrl;
}
