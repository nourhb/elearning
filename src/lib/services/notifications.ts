'use server';

import { getAdminServices } from '@/lib/firebase-admin';

interface NotificationParams {
    userId: string;
    title: string;
    message: string;
    link?: string;
}

/**
 * Creates a notification document in Firestore for a specific user.
 * @param params - The notification details.
 */
export async function createNotification(params: NotificationParams): Promise<void> {
    const { db } = getAdminServices();
    try {
        await db.collection('notifications').add({
            ...params,
            createdAt: new Date(),
            read: false,
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // We don't throw here as failing to create a notification
        // shouldn't block the primary user action.
    }
}

/**
 * Fetches all admin user IDs to send them notifications.
 * @returns An array of admin UIDs.
 */
export async function getAdminUserIds(): Promise<string[]> {
    const { db } = getAdminServices();
    try {
        const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        if (adminsSnapshot.empty) {
            return [];
        }
        return adminsSnapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        return [];
    }
}
