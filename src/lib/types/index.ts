
/**
 * @fileoverview
 * This file contains all the shared type definitions for the application.
 */

/**
 * Represents the public profile of a user.
 * Stored in the 'users' collection in Firestore.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'formateur' | 'student';
  createdAt: Date | string;
  status: 'active' | 'suspended';
  createdBy?: string; // UID of the user who created this account
}

/**
 * Represents a single lesson within a module.
 */
export interface Lesson {
    id: string;
    title: string;
    description?: string;
    contentType: 'video' | 'document' | 'text';
    videoSource: 'youtube' | 'vimeo' | 'gdrive' | 'self-hosted' | null;
    url?: string; // For videos or document links
    content?: string; // For text-based lessons or video descriptions
}

/**
 * Represents a single module or lesson within a course.
 */
export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

/**
 * Represents a course in the platform.
 * Stored in the 'courses' collection in Firestore.
 */
export interface Course {
  id:string;
  title: string;
  description: string;
  imageUrl: string;
  aiHint: string;
  instructorId: string;
  status: 'Published' | 'Draft' | 'Archived';
  studentCount: number;
  modules: Module[];
  createdAt?: Date;
}


/**
 * Represents a student's progress in a course.
 * Stored in the 'progress' collection in Firestore.
 */
export interface UserProgress {
    id: string;
    userId: string;
    courseId: string;
    progress: number; // Percentage, 0-100
    completed: boolean;
    completedLessons: string[]; // Array of completed lesson IDs
    startedAt?: Date;
    completedAt?: Date;
}

/**
 * Represents a single achievement or badge that a user can earn.
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>; // Lucide icon component
}

/**
 * Represents a message in the real-time chat.
 */
export interface ChatMessage {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string | null;
    createdAt: Date;
}

/**
 * Represents a post in the community forum.
 */
export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string | null;
    createdAt: Date;
    replyCount: number;
    likes: number;
    likedBy: string[];
}

/**
 * Represents a reply to a post.
 */
export interface Reply {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string | null;
    createdAt: Date;
    likes: number;
    likedBy: string[];
}

/**
 * Represents an in-app notification.
 */
export interface Notification {
    id: string;
    userId: string; // The user who should receive the notification
    title: string;
    message: string;
    link?: string; // Optional link for the notification to lead to
    read: boolean;
    createdAt: Date;
}
