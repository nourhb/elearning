interface CreateCourseInput {
    title: string;
    description: string;
    instructorId: string;
    category: string;
    level: string;
    imageUrl?: string;
    modules: { id: string; title: string; lessons: any[] }[];
}

import { getAdminServices } from '@/lib/firebase-admin';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

export async function createCourse(input: CreateCourseInput): Promise<void> {
    const { db } = getAdminServices();
    await db.collection('courses').add({
        title: input.title,
        description: input.description,
        instructorId: input.instructorId,
        category: input.category,
        level: input.level,
        imageUrl: input.imageUrl || DEFAULT_PLACEHOLDER_IMAGE,
        aiHint: null,
        status: 'Draft',
        studentCount: 0,
        modules: input.modules,
        createdAt: new Date(),
    });
}


