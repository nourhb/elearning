
// 'use server'; // Disabled for static export

import { z } from 'zod';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';
// import { createCourse } from '@/ai/flows/create-course'; // Disabled for static export
// import { getAdminServices } from '@/lib/firebase-admin'; // Disabled for static export
// import { revalidatePath } from 'next/cache'; // Disabled for static export

const courseSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  instructorId: z.string(),
  imageUrl: z.string().url({ message: 'Please upload an image.' }).or(z.literal('')).optional().default(DEFAULT_PLACEHOLDER_IMAGE),
  category: z.enum(['programming', 'design', 'music', 'gaming', 'business', 'lifestyle']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  modules: z.array(z.object({
    title: z.string().min(3, 'Module title must be at least 3 characters.'),
  })).min(1, 'At least one module is required.'),
});


export async function createCourseAction(prevState: any, formData: FormData) {
  
  const modulesString = formData.get('modules') as string;
  let modules = [];
  try {
    modules = JSON.parse(modulesString);
  } catch (error) {
    return { message: 'Invalid module data.' };
  }


  const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      instructorId: formData.get('instructorId'),
      imageUrl: formData.get('imageUrl'),
      category: formData.get('category'),
      level: formData.get('level'),
      modules: modules
  };

  const validationResult = courseSchema.safeParse(rawData);

  if (!validationResult.success) {
    // Flatten errors for easier display
    const errorMessages = validationResult.error.flatten().fieldErrors;
    return {
        message: 'Validation failed.',
        errors: {
            title: errorMessages.title?.[0],
            description: errorMessages.description?.[0],
            imageUrl: errorMessages.imageUrl?.[0],
            modules: errorMessages.modules?.[0],
        }
    };
  }

  try {
    const { db } = getAdminServices();
    const finalImageUrl = validationResult.data.imageUrl;

    // Check for duplicate course title
    const coursesRef = db.collection('courses');
    const existingCourse = await coursesRef.where('title', '==', validationResult.data.title).limit(1).get();

    if (!existingCourse.empty) {
        return {
            message: 'Validation failed.',
            errors: {
                title: 'A course with this title already exists.',
            }
        };
    }

    const modulesWithLessons = validationResult.data.modules.map((m, index) => ({
        id: `module-${Date.now()}-${index}`,
        title: m.title,
        lessons: [], // Start with an empty lessons array
    }));

    // Create the course with the actual imageUrl
    const newCourseData = {
      ...validationResult.data,
      modules: modulesWithLessons,
    };

    // Call the createCourse flow with the actual imageUrl
    await createCourse(newCourseData);
    
    revalidatePath('/formateur');

    return { success: true, message: 'Course created successfully!' };
    
  } catch (error: any) {
    return { message: error.message || 'An unexpected error occurred.' };
  }
}
