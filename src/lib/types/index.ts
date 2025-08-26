
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
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string; // UID of the user who created this account
  updatedBy?: string; // UID of the user who last updated this account
}

/**
 * Represents a single lesson within a module.
 */
export interface Lesson {
    id: string;
    title: string;
    content: string;
    duration: number; // in minutes
    completed?: boolean;
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
 * Represents a course in the system.
 * Stored in the 'courses' collection in Firestore.
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  imageUrl: string;
  aiHint: string;
  status: 'Draft' | 'Published';
  studentCount: number;
  modules: Module[];
  category: 'programming' | 'design' | 'music' | 'gaming' | 'business' | 'lifestyle';
  level: 'beginner' | 'intermediate' | 'advanced';
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
    icon: string;
    criteria: string;
}

/**
 * Represents a quiz question with multiple choice answers.
 */
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // Index of the correct option (0-3)
    explanation?: string; // Explanation shown after answering
    points: number; // Points awarded for correct answer
    difficulty: 'easy' | 'medium' | 'hard';
    category?: string; // Optional category for organization
}

/**
 * Represents a complete quiz.
 */
export interface Quiz {
    id: string;
    title: string;
    description: string;
    courseId: string; // Associated course
    moduleId?: string; // Optional: specific module
    questions: QuizQuestion[];
    timeLimit?: number; // Time limit in minutes (optional)
    passingScore: number; // Minimum score to pass (percentage)
    maxAttempts: number; // Maximum number of attempts allowed
    isActive: boolean; // Whether the quiz is available
    createdAt: Date;
    updatedAt: Date;
    createdBy: string; // Instructor who created the quiz
}

/**
 * Represents a student's attempt at a quiz.
 */
export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    courseId: string;
    answers: {
        questionId: string;
        selectedAnswer: number; // Index of selected option
        isCorrect: boolean;
        timeSpent: number; // Time spent on this question in seconds
    }[];
    score: number; // Total score achieved
    percentage: number; // Percentage score (0-100)
    passed: boolean; // Whether the attempt passed
    timeSpent: number; // Total time spent in seconds
    startedAt: Date;
    completedAt?: Date;
    attemptNumber: number; // Which attempt this is (1, 2, 3, etc.)
}

/**
 * Represents quiz statistics and analytics.
 */
export interface QuizStats {
    totalAttempts: number;
    averageScore: number;
    passRate: number; // Percentage of attempts that passed
    averageTimeSpent: number; // Average time spent in minutes
    questionStats: {
        questionId: string;
        correctAnswers: number;
        totalAnswers: number;
        averageTimeSpent: number;
        difficulty: string;
    }[];
}

/**
 * Represents a community discussion or post.
 * Stored in the 'discussions' collection in Firestore.
 */
export interface Discussion {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    category: 'general' | 'technical' | 'help' | 'showcase';
    tags: string[];
    likes: number;
    replies: number;
    createdAt: Date;
    updatedAt: Date;
    isPinned?: boolean;
    isLocked?: boolean;
}

/**
 * Represents a reply to a discussion.
 * Stored in the 'replies' collection in Firestore.
 */
export interface Reply {
    id: string;
    discussionId: string;
    content: string;
    authorId: string;
    authorName: string;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
    isSolution?: boolean;
}

/**
 * Represents community statistics and metrics.
 */
export interface CommunityStats {
    totalMembers: number;
    activeMembers: number;
    totalDiscussions: number;
    totalReplies: number;
    totalAchievements: number;
    growthRate: number;
    topContributors: {
        uid: string;
        displayName: string;
        contributions: number;
        avatar?: string;
        reputation: number;
    }[];
}

/**
 * Represents a user's community profile with contribution metrics.
 */
export interface UserCommunityProfile {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    role: 'student' | 'formateur' | 'admin';
    avatar?: string;
    bio: string;
    status: 'active' | 'inactive' | 'banned';
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    reputation: number;
    level: number;
    badges: string[];
    following?: string[]; // Array of user IDs being followed
    followers?: string[]; // Array of user IDs following this user
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
}

/**
 * Represents a chat message in the community chat.
 * Stored in the 'messages' collection in Firestore.
 */
export interface ChatMessage {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: Date;
    isDeleted?: boolean;
    deletedBy?: string;
    deletedAt?: Date;
    deletionReason?: string;
}

/**
 * Represents a community post with rich content and interactions.
 * Stored in the 'communityPosts' collection in Firestore.
 */
export interface CommunityPost {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    media?: PostMedia[];
    tags: string[];
    mentions: string[]; // Array of user IDs mentioned in the post
    category: 'general' | 'question' | 'showcase' | 'discussion' | 'announcement';
    likes: number;
    comments: number;
    shares: number;
    views: number;
    isPinned: boolean;
    isLocked: boolean;
    isDeleted: boolean;
    deletedBy?: string;
    deletedAt?: Date;
    deletionReason?: string;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
    liked?: boolean; // Whether the current user has liked this post
}

/**
 * Represents media content in a post (images, videos, files).
 */
export interface PostMedia {
    id: string;
    type: 'image' | 'video' | 'file';
    url: string;
    thumbnailUrl?: string;
    filename?: string;
    size?: number;
    duration?: number; // For videos
    width?: number;
    height?: number;
    alt?: string;
}

/**
 * Represents a comment on a community post.
 * Stored in the 'postComments' collection in Firestore.
 */
export interface PostComment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    media?: PostMedia[];
    mentions: string[]; // Array of user IDs mentioned in the comment
    likes: number;
    replies: number;
    parentCommentId?: string; // For nested replies
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedBy?: string;
    deletedAt?: Date;
    deletionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Represents a user interaction with a post (like, share, view).
 * Stored in the 'postInteractions' collection in Firestore.
 */
export interface PostInteraction {
    id: string;
    postId: string;
    userId: string;
    type: 'like' | 'share' | 'view' | 'bookmark';
    createdAt: Date;
}

/**
 * Represents a user notification for community activities.
 * Stored in the 'userNotifications' collection in Firestore.
 */
export interface UserNotification {
    id: string;
    userId: string;
    type: 'post_like' | 'post_comment' | 'comment_reply' | 'mention' | 'tag' | 'follow' | 'achievement';
    title: string;
    message: string;
    data: {
        postId?: string;
        commentId?: string;
        mentionedBy?: string;
        mentionedByUser?: string;
        achievementId?: string;
        achievementName?: string;
    };
    isRead: boolean;
    createdAt: Date;
}

/**
 * Represents community statistics with enhanced metrics.
 */
export interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  totalAchievements: number;
  growthRate: number;
  engagementRate: number;
  topContributors: {
    uid: string;
    displayName: string;
    contributions: number;
    avatar?: string;
    reputation: number;
  }[];
  trendingTopics: string[];
  recentActivity: any[];
}

/**
 * Represents an enrollment request from a student to a course
 */
export interface EnrollmentRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  instructorId: string; // ID of the course creator
  status: 'pending' | 'approved' | 'denied';
  requestMessage?: string; // Optional message from student
  responseMessage?: string; // Optional message from admin/instructor
  respondedBy?: string; // UID of admin/instructor who responded
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
