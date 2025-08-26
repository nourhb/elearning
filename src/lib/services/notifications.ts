'use server';

import { Firestore } from 'firebase-admin/firestore';
import { sendEmail } from './email';

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  data?: any;
}

/**
 * Create a notification for a user
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const notificationsCollection = db.collection('notifications');
  
  const newNotification: Omit<Notification, 'id'> = {
    ...notification,
    read: false,
    createdAt: new Date(),
  };

  const docRef = await notificationsCollection.add(newNotification);
  const createdNotification = { ...newNotification, id: docRef.id } as Notification;

  // Send email notification if user has email
  try {
    const userDoc = await db.collection('users').doc(notification.userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.email) {
        await sendEmailNotification({
          to: userData.email,
          subject: notification.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${notification.title}</h2>
              <p style="color: #666; line-height: 1.6;">${notification.message}</p>
              ${notification.link ? `<p><a href="${notification.link}" style="color: #007bff; text-decoration: none;">View Details</a></p>` : ''}
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">This is an automated notification from DigitalMen0 Learning Platform.</p>
            </div>
          `,
          data: notification.data
        });
      }
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }

  return createdNotification;
}

/**
 * Send email notification
 */
export async function sendEmailNotification(emailNotification: EmailNotification): Promise<void> {
  try {
    await sendEmail(emailNotification);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getNotificationsForUser(userId: string, limit: number = 50): Promise<Notification[]> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const notificationsCollection = db.collection('notifications');
  const snapshot = await notificationsCollection
    .where('userId', '==', userId)
    .limit(limit)
    .get();

  // Sort in memory to avoid composite index requirement
  const notifications = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
    } as Notification;
  });

  // Sort by createdAt descending
  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const notificationRef = db.collection('notifications').doc(notificationId);
  await notificationRef.update({ read: true });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const notificationsCollection = db.collection('notifications');
  const snapshot = await notificationsCollection
    .where('userId', '==', userId)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    if (!doc.data().read) {
      batch.update(doc.ref, { read: true });
    }
  });

  await batch.commit();
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const notificationsCollection = db.collection('notifications');
  const snapshot = await notificationsCollection
    .where('userId', '==', userId)
    .get();

  // Count unread notifications in memory
  return snapshot.docs.filter(doc => !doc.data().read).length;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const notificationRef = db.collection('notifications').doc(notificationId);
  await notificationRef.delete();
}

/**
 * Get admin user IDs for sending admin notifications
 */
export async function getAdminUserIds(): Promise<string[]> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const usersCollection = db.collection('users');
  const snapshot = await usersCollection.where('role', '==', 'admin').get();
  
  return snapshot.docs.map(doc => doc.id);
}

/**
 * Send notification to all admins
 */
export async function notifyAllAdmins(notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void> {
  const adminIds = await getAdminUserIds();
  
  const notificationPromises = adminIds.map(adminId => 
    createNotification({
      ...notification,
      userId: adminId
    })
  );
  
  await Promise.all(notificationPromises);
}

/**
 * Send notification to all instructors
 */
export async function notifyAllInstructors(notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void> {
  const { getAdminServices } = await import('@/lib/firebase-admin');
  const { db } = getAdminServices();
  
  const usersCollection = db.collection('users');
  const snapshot = await usersCollection.where('role', '==', 'formateur').get();
  
  const instructorIds = snapshot.docs.map(doc => doc.id);
  
  const notificationPromises = instructorIds.map(instructorId => 
    createNotification({
      ...notification,
      userId: instructorId
    })
  );
  
  await Promise.all(notificationPromises);
}
