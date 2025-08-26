
'use server';

import { z } from 'zod';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { getAdminServices } from '@/lib/firebase-admin';

const lessonSchema = z.object({
  id: z.string(),
  title: z.string().min(3, 'Lesson title must be at least 3 characters.'),
  description: z.string().optional(),
  contentType: z.enum(['video', 'document', 'text']),
  videoSource: z.enum(['youtube', 'vimeo', 'gdrive', 'self-hosted']).optional().nullable(),
  url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
});

const moduleSchema = z.object({
  id: z.string(),
  title: z.string().min(3, 'Module title must be at least 3 characters.'),
  lessons: z.array(lessonSchema).optional(),
});

const courseSchema = z.object({
  courseId: z.string(),
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  imageUrl: z.string().url({ message: 'Please upload an image.' }).optional().default(DEFAULT_PLACEHOLDER_IMAGE),
  category: z.enum(['programming', 'design', 'music', 'gaming', 'business', 'lifestyle']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  modules: z.array(moduleSchema).min(1, 'At least one module is required.'),
});


export async function updateCourseAction(prevState: any, formData: FormData) {
  
  const modulesString = formData.get('modules') as string;
  let modules = [];
  try {
    modules = JSON.parse(modulesString);
  } catch (error) {
    return { message: 'Invalid module data.' };
  }

  const rawData = {
      courseId: formData.get('courseId'),
      title: formData.get('title'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      category: formData.get('category'),
      level: formData.get('level'),
      modules,
  };

  const validationResult = courseSchema.safeParse(rawData);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.flatten().fieldErrors;
    console.log('Validation Errors:', errorMessages);
    return {
        message: 'Validation failed.',
        errors: {
            title: errorMessages.title?.[0],
            description: errorMessages.description?.[0],
            imageUrl: errorMessages.imageUrl?.[0],
            modules: errorMessages.modules?.[0] || 'Error in module data.',
        }
    };
  }

  try {
    const { db } = getAdminServices();
    const { courseId, title, description, imageUrl, category, level, modules: validatedModules } = validationResult.data;
    
    // Check for duplicate course title, excluding the current course
    const coursesRef = db.collection('courses');
    const existingCourse = await coursesRef.where('title', '==', title).limit(1).get();

    if (!existingCourse.empty && existingCourse.docs[0].id !== courseId) {
        return {
            message: 'Validation failed.',
            errors: {
                title: 'Another course with this title already exists.',
            }
        };
    }
    
    const courseRef = db.collection('courses').doc(courseId);
    
    // Save the imageUrl (Cloudinary URLs are persistent)
    const imageUrlToSave = imageUrl;
    
    await courseRef.update({
        title,
        description,
        imageUrl: imageUrlToSave,
        category,
        level,
        modules: validatedModules, // Use the fully validated and structured modules data
    });
    
    revalidatePath('/formateur');
    revalidatePath(`/formateur/courses/${courseId}/edit`);

    return { success: true, message: 'Course updated successfully!' };
    
  } catch (error: any) {
    console.error("Update error:", error);
    return { message: error.message || 'An unexpected error occurred.' };
  }
}

export async function deleteCourseAction(courseId: string) {
    if (!courseId) {
        throw new Error('Course ID is required.');
    }
    try {
        const { db } = getAdminServices();
        await db.collection('courses').doc(courseId).delete();

        // Note: In a real app, you'd also want to delete associated progress, etc.
        // For this example, we'll just delete the course document.

        revalidatePath('/formateur');
    } catch (error: any) {
        console.error('Failed to delete course:', error);
        throw new Error('Could not delete the course from the database.');
    }
}
