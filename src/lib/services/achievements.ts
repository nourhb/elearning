
import { Star, Award } from 'lucide-react';
import type { Achievement, UserProgress } from '@/lib/types';
import i18n from '@/lib/i18n';


/**
 * Defines all available achievements in the platform.
 */
export const allAchievements: Omit<Achievement, 'name' | 'description'>[] = [
    {
        id: 'first-course-completed',
        icon: Star,
    },
    {
        id: 'top-performer',
        icon: Award,
    }
];

/**
 * Checks which achievements a user has earned based on their progress.
 * @param userProgress - A list of the user's progress records.
 * @returns A list of earned achievement objects.
 */
export function getEarnedAchievements(userProgress: UserProgress[]): Achievement[] {
    const earned: Achievement[] = [];

    // Check for "First Course Completed"
    const hasCompletedCourse = userProgress.some(p => p.completed && p.completedAt);
    if (hasCompletedCourse) {
        earned.push({
            id: 'first-course-completed',
            name: i18n.t('firstCourseCompleted'),
            description: i18n.t('firstCourseCompletedDesc'),
            icon: Star,
        });
    }

    // Placeholder for "Top Performer" - logic would be more complex
    // For now, we can grant it if they have completed more than one course.
    const completedCoursesCount = userProgress.filter(p => p.completed).length;
    if (completedCoursesCount > 1) {
         earned.push({
            id: 'top-performer',
            name: i18n.t('topPerformer'),
            description: i18n.t('topPerformerDesc'),
            icon: Award,
        });
    }

    return earned;
}
