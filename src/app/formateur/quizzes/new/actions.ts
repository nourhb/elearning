'use server';

import { z } from 'zod';
import { getAdminServices } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Question text is required'),
  options: z.array(z.string().min(1, 'Option text is required')).min(2, 'At least 2 options required'),
  correctAnswer: z.number().min(0, 'Correct answer is required'),
  explanation: z.string().optional(),
  points: z.number().min(1, 'Points must be at least 1').max(10, 'Points cannot exceed 10'),
});

const quizSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  courseId: z.string().min(1, { message: 'Course is required.' }),
  timeLimit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  passingScore: z.string().transform(val => parseInt(val)),
  maxAttempts: z.string().transform(val => parseInt(val)),
  isActive: z.string().transform(val => val === 'true'),
  questions: z.string().transform(val => {
    try {
      return JSON.parse(val);
    } catch {
      throw new Error('Invalid questions format');
    }
  }),
  createdBy: z.string().min(1, { message: 'Creator is required.' }),
});

export async function createQuizAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      courseId: formData.get('courseId'),
      timeLimit: formData.get('timeLimit'),
      passingScore: formData.get('passingScore'),
      maxAttempts: formData.get('maxAttempts'),
      isActive: formData.get('isActive'),
      questions: formData.get('questions'),
      createdBy: formData.get('createdBy'),
    };

    console.log('Raw form data:', rawData); // Debug logging

    const validationResult = quizSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.flatten()); // Debug logging
      const errorMessages = validationResult.error.flatten().fieldErrors;
      return {
        message: 'Validation failed.',
        errors: {
          title: errorMessages.title?.[0],
          description: errorMessages.description?.[0],
          courseId: errorMessages.courseId?.[0],
          timeLimit: errorMessages.timeLimit?.[0],
          passingScore: errorMessages.passingScore?.[0],
          maxAttempts: errorMessages.maxAttempts?.[0],
          isActive: errorMessages.isActive?.[0],
          questions: errorMessages.questions?.[0],
        }
      };
    }

    const { questions, ...quizData } = validationResult.data;

    // Validate questions
    const questionsValidation = z.array(questionSchema).safeParse(questions);
    if (!questionsValidation.success) {
      return {
        message: 'Validation failed.',
        errors: {
          questions: 'Invalid question format. Please check all questions and options.',
        }
      };
    }

    // Validate passing score
    if (quizData.passingScore < 1 || quizData.passingScore > 100) {
      return {
        message: 'Validation failed.',
        errors: {
          passingScore: 'Passing score must be between 1 and 100.',
        }
      };
    }

    // Validate max attempts
    if (quizData.maxAttempts < 1 || quizData.maxAttempts > 10) {
      return {
        message: 'Validation failed.',
        errors: {
          maxAttempts: 'Maximum attempts must be between 1 and 10.',
        }
      };
    }

    // Role-based max attempts validation
    const roleMaxAttempts = {
      admin: 20,
      formateur: 15,
      student: 5
    };
    
    const userRole = rawData.createdBy ? await getAdminServices().auth.getUser(rawData.createdBy as string).then(u => u.customClaims?.role || 'student').catch(() => 'student') : 'student';
    const maxAllowed = roleMaxAttempts[userRole as keyof typeof roleMaxAttempts] || 5;
    
    if (quizData.maxAttempts > maxAllowed) {
      return {
        message: 'Validation failed.',
        errors: {
          maxAttempts: `Maximum attempts cannot exceed ${maxAllowed} for ${userRole} role.`,
        }
      };
    }

    // Validate time limit if provided
    if (quizData.timeLimit !== undefined && (quizData.timeLimit < 1 || quizData.timeLimit > 300)) {
      return {
        message: 'Validation failed.',
        errors: {
          timeLimit: 'Time limit must be between 1 and 300 minutes.',
        }
      };
    }

    try {
      const { db } = getAdminServices();
      
      const newQuiz = {
        title: quizData.title,
        description: quizData.description,
        courseId: quizData.courseId,
        timeLimit: quizData.timeLimit,
        passingScore: quizData.passingScore,
        maxAttempts: quizData.maxAttempts,
        isActive: quizData.isActive,
        questions: questionsValidation.data.map(q => ({
          id: q.id,
          question: q.text, // Map text to question
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
          difficulty: 'medium' as const, // Default difficulty
        })),
        createdBy: quizData.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Use Firebase Admin directly
      const quizRef = await db.collection('quizzes').add(newQuiz);
      const quizId = quizRef.id;
      
      revalidatePath('/formateur');
      revalidatePath('/formateur/quizzes');

      return { 
        success: true, 
        message: 'Quiz created successfully!',
        quizId 
      };
      
    } catch (error: any) {
      return { 
        message: error.message || 'An unexpected error occurred while creating the quiz.' 
      };
    }
    
  } catch (error: any) {
    return { 
      message: error.message || 'An unexpected error occurred.' 
    };
  }
}
