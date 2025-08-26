import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  Firestore, 
  DocumentData, 
  FirestoreDataConverter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  QueryDocumentSnapshot,
  SnapshotOptions,
  setDoc
} from 'firebase/firestore';
import type { 
  CommunityPost, 
  PostComment, 
  PostInteraction, 
  PostMedia,
  CommunityStats, 
  UserCommunityProfile, 
  UserNotification,
  UserProfile 
} from '@/lib/types';

// Community Post Converter
export const communityPostConverter: FirestoreDataConverter<CommunityPost> = {
  toFirestore(post: CommunityPost): DocumentData {
    const { id, ...data } = post;
    const firestoreData: any = {
      ...data,
      createdAt: post.createdAt ? Timestamp.fromDate(post.createdAt) : serverTimestamp(),
      updatedAt: post.updatedAt ? Timestamp.fromDate(post.updatedAt) : serverTimestamp(),
      lastActivityAt: post.lastActivityAt ? Timestamp.fromDate(post.lastActivityAt) : serverTimestamp(),
      deletedAt: post.deletedAt ? Timestamp.fromDate(post.deletedAt) : null,
    };
    
    // Remove undefined fields
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key] === undefined) {
        delete firestoreData[key];
      }
    });
    
    return firestoreData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): CommunityPost {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastActivityAt: data.lastActivityAt?.toDate() || new Date(),
      deletedAt: data.deletedAt?.toDate() || null,
    } as CommunityPost;
  },
};

// Post Comment Converter
export const postCommentConverter: FirestoreDataConverter<PostComment> = {
  toFirestore(comment: PostComment): DocumentData {
    const { id, ...data } = comment;
    const firestoreData: any = {
      ...data,
      createdAt: comment.createdAt ? Timestamp.fromDate(comment.createdAt) : serverTimestamp(),
      updatedAt: comment.updatedAt ? Timestamp.fromDate(comment.updatedAt) : serverTimestamp(),
      editedAt: comment.editedAt ? Timestamp.fromDate(comment.editedAt) : null,
      deletedAt: comment.deletedAt ? Timestamp.fromDate(comment.deletedAt) : null,
    };
    
    // Remove undefined fields
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key] === undefined) {
        delete firestoreData[key];
      }
    });
    
    return firestoreData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): PostComment {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      editedAt: data.editedAt?.toDate() || null,
      deletedAt: data.deletedAt?.toDate() || null,
    } as PostComment;
  },
};

// Community Posts
export async function createCommunityPost(db: Firestore, post: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'likes' | 'comments' | 'shares' | 'views' | 'isPinned' | 'isLocked' | 'isDeleted'>): Promise<string> {
  try {
    const postsCollection = collection(db, 'communityPosts');
    
    const postData = {
      ...post,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      isPinned: false,
      isLocked: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(postsCollection, postData);
    
    // Update user's post count
    try {
      await updateUserCommunityProfile(db, post.authorId, {
        totalPosts: increment(1)
      });
    } catch (profileError) {
      console.warn('Could not update user profile, but post was created:', profileError);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating community post:', error);
    throw error;
  }
}

export async function getCommunityPosts(
  db: Firestore, 
  options: { 
    limit?: number; 
    category?: string; 
    authorId?: string; 
    tags?: string[]; 
    includeDeleted?: boolean; 
  } = {}
): Promise<CommunityPost[]> {
  try {
    const { limit: limitCount = 20, category, authorId, tags, includeDeleted = false } = options;
    const postsCollection = collection(db, 'communityPosts').withConverter(communityPostConverter);
    
    // Build query step by step to avoid complex composite indexes
    let constraints = [];
    
    // Add where clauses first
    if (!includeDeleted) {
      constraints.push(where('isDeleted', '==', false));
    }
    
    if (category) {
      constraints.push(where('category', '==', category));
    }
    
    if (authorId) {
      constraints.push(where('authorId', '==', authorId));
    }
    
    // Add ordering and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));
    
    const q = query(postsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    let posts = querySnapshot.docs.map(doc => doc.data());
    
    // Filter by tags if specified (client-side filtering)
    if (tags && tags.length > 0) {
      posts = posts.filter(post => 
        post.tags && tags.some(tag => post.tags.includes(tag))
      );
    }
    
    // Sort posts: pinned posts first, then by creation date (newest first)
    posts.sort((a, b) => {
      // First, sort by pinned status (pinned posts first)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // If both have the same pinned status, sort by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return posts;
  } catch (error: any) {
    console.error('Error fetching community posts:', error);
    
    // If it's an index error, try a simpler fallback query
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.warn('Firestore index is still building. Trying fallback query...');
      
      try {
        // Fallback: simple query without complex filters
        const postsCollection = collection(db, 'communityPosts').withConverter(communityPostConverter);
        const fallbackQuery = query(
          postsCollection,
          orderBy('createdAt', 'desc'),
          limit(options.limit || 20)
        );
        
        const querySnapshot = await getDocs(fallbackQuery);
        let posts = querySnapshot.docs.map(doc => doc.data());
        
        // Apply filters client-side
        if (!options.includeDeleted) {
          posts = posts.filter(post => !post.isDeleted);
        }
        
        if (options.category) {
          posts = posts.filter(post => post.category === options.category);
        }
        
        if (options.authorId) {
          posts = posts.filter(post => post.authorId === options.authorId);
        }
        
        if (options.tags && options.tags.length > 0) {
          posts = posts.filter(post => 
            post.tags && options.tags!.some(tag => post.tags.includes(tag))
          );
        }
        
        // Sort posts: pinned posts first, then by creation date (newest first)
        posts.sort((a, b) => {
          // First, sort by pinned status (pinned posts first)
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          // If both have the same pinned status, sort by creation date (newest first)
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        return posts;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
    
    return [];
  }
}

export async function getCommunityPost(db: Firestore, postId: string): Promise<CommunityPost | null> {
  try {
    const postDoc = doc(db, 'communityPosts', postId).withConverter(communityPostConverter);
    const postSnapshot = await getDoc(postDoc);
    
    if (postSnapshot.exists()) {
      return postSnapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching community post:', error);
    return null;
  }
}

export async function updateCommunityPost(
  db: Firestore, 
  postId: string, 
  updates: Partial<CommunityPost>
): Promise<void> {
  try {
    const postRef = doc(db, 'communityPosts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating community post:', error);
    throw error;
  }
}

export async function deleteCommunityPost(
  db: Firestore, 
  postId: string, 
  deletedBy: string, 
  reason?: string
): Promise<void> {
  try {
    const postRef = doc(db, 'communityPosts', postId);
    await updateDoc(postRef, {
      isDeleted: true,
      deletedBy,
      deletedAt: serverTimestamp(),
      deletionReason: reason || 'Post deleted by user',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting community post:', error);
    throw error;
  }
}

// Comments
export async function createPostComment(db: Firestore, comment: Omit<PostComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'replies' | 'isEdited' | 'isDeleted'>): Promise<string> {
  try {
    const commentsCollection = collection(db, 'postComments');
    
    const commentData = {
      ...comment,
      likes: 0,
      replies: 0,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(commentsCollection, commentData);
    
    // Update post's comment count
    try {
      const postRef = doc(db, 'communityPosts', comment.postId);
      await updateDoc(postRef, {
        comments: increment(1),
        lastActivityAt: serverTimestamp(),
      });
    } catch (postError) {
      console.warn('Could not update post comment count:', postError);
    }
    
    // Update user's comment count
    try {
      await updateUserCommunityProfile(db, comment.authorId, {
        totalComments: increment(1)
      });
    } catch (profileError) {
      console.warn('Could not update user profile, but comment was created:', profileError);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating post comment:', error);
    throw error;
  }
}

export async function getPostComments(
  db: Firestore, 
  postId: string, 
  options: { limit?: number; includeDeleted?: boolean } = {}
): Promise<PostComment[]> {
  const { limit: limitCount = 50, includeDeleted = false } = options;
  
  try {
    // Use a completely index-free approach - get all comments and filter client-side
    console.log('Using completely index-free approach for comments...');
    
    const commentsCollection = collection(db, 'postComments').withConverter(postCommentConverter);
    
    // Get ALL comments without any query constraints (no indexes needed)
    const allCommentsSnapshot = await getDocs(commentsCollection);
    let allComments = allCommentsSnapshot.docs.map(doc => doc.data());
    
    console.log(`Retrieved ${allComments.length} total comments, filtering for postId: ${postId}`);
    
    // Filter by postId
    allComments = allComments.filter((comment: PostComment) => comment.postId === postId);
    
    // Filter by isDeleted if needed
    if (!includeDeleted) {
      allComments = allComments.filter((comment: PostComment) => !comment.isDeleted);
    }
    
    // Sort by createdAt
    allComments.sort((a: PostComment, b: PostComment) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Apply limit
    const result = allComments.slice(0, limitCount);
    console.log(`Returning ${result.length} comments for post ${postId}`);
    
    return result;
  } catch (error: any) {
    console.error('Error in index-free comment fetch:', error);
    return [];
  }
}

export async function updatePostComment(
  db: Firestore, 
  commentId: string, 
  updates: Partial<PostComment>
): Promise<void> {
  try {
    const commentRef = doc(db, 'postComments', commentId);
    await updateDoc(commentRef, {
      ...updates,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating post comment:', error);
    throw error;
  }
}

export async function deletePostComment(
  db: Firestore, 
  commentId: string, 
  deletedBy: string, 
  reason?: string
): Promise<void> {
  try {
    const commentRef = doc(db, 'postComments', commentId);
    await updateDoc(commentRef, {
      isDeleted: true,
      deletedBy,
      deletedAt: serverTimestamp(),
      deletionReason: reason || 'Comment deleted by user',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting post comment:', error);
    throw error;
  }
}

// Interactions (Likes, Shares, Views)
export async function likePost(db: Firestore, postId: string, userId: string): Promise<void> {
  try {
    const interactionRef = doc(db, 'postInteractions', `${postId}_${userId}_like`);
    const interactionDoc = await getDoc(interactionRef);
    
    if (interactionDoc.exists()) {
      // Unlike
      await deleteDoc(interactionRef);
      await updateDoc(doc(db, 'communityPosts', postId), {
        likes: increment(-1)
      });
    } else {
      // Like
      await setDoc(interactionRef, {
        postId,
        userId,
        type: 'like',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'communityPosts', postId), {
        likes: increment(1)
      });
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
}

export async function sharePost(db: Firestore, postId: string, userId: string, shareType: 'copy' | 'social' = 'copy'): Promise<void> {
  try {
    // Create a share record
    const interactionRef = doc(db, 'postInteractions', `${postId}_${userId}_share_${Date.now()}`);
    await setDoc(interactionRef, {
      postId,
      userId,
      type: 'share',
      shareType,
      createdAt: serverTimestamp(),
    });
    
    // Increment the share count on the post
    await updateDoc(doc(db, 'communityPosts', postId), {
      shares: increment(1)
    });
  } catch (error) {
    console.error('Error recording post share:', error);
    throw error;
  }
}

export async function viewPost(db: Firestore, postId: string, userId: string): Promise<void> {
  try {
    const interactionRef = doc(db, 'postInteractions', `${postId}_${userId}_view`);
    const interactionDoc = await getDoc(interactionRef);
    
    if (!interactionDoc.exists()) {
      await setDoc(interactionRef, {
        postId,
        userId,
        type: 'view',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'communityPosts', postId), {
        views: increment(1)
      });
    }
  } catch (error) {
    console.error('Error recording post view:', error);
  }
}

// Pin/Unpin post
export async function pinPost(db: Firestore, postId: string, userId: string): Promise<void> {
  try {
    const postRef = doc(db, 'communityPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postDoc.data();
    const isCurrentlyPinned = postData.isPinned || false;
    
    // Toggle pin status
    await updateDoc(postRef, {
      isPinned: !isCurrentlyPinned,
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    });
    
    // Create a pin interaction record
    const interactionRef = doc(db, 'postInteractions', `${postId}_${userId}_pin`);
    if (!isCurrentlyPinned) {
      // Pin the post
      await setDoc(interactionRef, {
        postId,
        userId,
        type: 'pin',
        createdAt: serverTimestamp(),
      });
    } else {
      // Unpin the post
      await deleteDoc(interactionRef);
    }
  } catch (error) {
    console.error('Error toggling post pin:', error);
    throw error;
  }
}

// Helper function to check if a user has liked a post
export async function hasUserLikedPost(db: Firestore, postId: string, userId: string): Promise<boolean> {
  try {
    const interactionRef = doc(db, 'postInteractions', `${postId}_${userId}_like`);
    const interactionDoc = await getDoc(interactionRef);
    return interactionDoc.exists();
  } catch (error) {
    console.error('Error checking if user liked post:', error);
    return false;
  }
}

// User Community Profiles
export async function getUserCommunityProfile(db: Firestore, userId: string): Promise<UserCommunityProfile | null> {
  try {
    const profileDoc = doc(db, 'userCommunityProfiles', userId);
    const profileSnapshot = await getDoc(profileDoc);
    
    if (profileSnapshot.exists()) {
      return profileSnapshot.data() as UserCommunityProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user community profile:', error);
    return null;
  }
}

export async function updateUserCommunityProfile(
  db: Firestore, 
  userId: string, 
  updates: Partial<UserCommunityProfile>
): Promise<void> {
  try {
    const profileRef = doc(db, 'userCommunityProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    // Clean the updates to remove undefined values
    const cleanUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    if (profileDoc.exists()) {
      // Profile exists, update it
      await updateDoc(profileRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });
    } else {
      // Profile doesn't exist, create it with basic data
      const cleanProfile = {
        uid: userId,
        email: '',
        displayName: 'Anonymous',
        role: 'student',
        bio: '',
        status: 'active',
        avatar: null,
        totalPosts: cleanUpdates.totalPosts || 0,
        totalComments: cleanUpdates.totalComments || 0,
        totalLikes: cleanUpdates.totalLikes || 0,
        reputation: 0,
        level: 1,
        badges: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      };
      
      await setDoc(profileRef, cleanProfile);
    }
  } catch (error) {
    console.error('Error updating user community profile:', error);
    // Don't throw error to prevent post creation from failing
  }
}

export async function createUserCommunityProfile(
  db: Firestore,
  profile: Omit<UserCommunityProfile, 'id' | 'createdAt' | 'updatedAt' | 'totalPosts' | 'totalComments' | 'totalLikes' | 'reputation' | 'level' | 'badges' | 'lastActivityAt'>
): Promise<string> {
  try {
    const profilesCollection = collection(db, 'userCommunityProfiles');
    
    // Clean the profile data to remove undefined values
    const cleanProfile = {
      uid: profile.uid || '',
      email: profile.email || '',
      displayName: profile.displayName || 'Anonymous',
      role: profile.role || 'student',
      bio: profile.bio || '',
      status: profile.status || 'active',
      avatar: profile.avatar || null, // Use null instead of undefined
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      reputation: 0,
      level: 1,
      badges: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(profilesCollection, cleanProfile);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user community profile:', error);
    throw error;
  }
}

// Notifications
export async function createUserNotification(
  db: Firestore, 
  notification: Omit<UserNotification, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const notificationsCollection = collection(db, 'userNotifications');
    const docRef = await addDoc(notificationsCollection, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user notification:', error);
    throw error;
  }
}

export async function getUserNotifications(
  db: Firestore, 
  userId: string, 
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<UserNotification[]> {
  try {
    const { limit: limitCount = 20, unreadOnly = false } = options;
    const notificationsCollection = collection(db, 'userNotifications');
    
    let q = query(
      notificationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (unreadOnly) {
      q = query(q, where('isRead', '==', false));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
    })) as UserNotification[];
  } catch (error: any) {
    console.error('Error fetching user notifications:', error);
    
    // If it's an index error, try a simple fallback query
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.warn('Firestore index is still building. Trying simple fallback query for notifications...');
      
      try {
        // Fallback: get all notifications and filter client-side (no indexes needed)
        const notificationsCollection = collection(db, 'userNotifications');
        const fallbackQuery = query(notificationsCollection);
        
        const querySnapshot = await getDocs(fallbackQuery);
        let notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        })) as UserNotification[];
        
        // Apply all filters client-side
        notifications = notifications.filter(notification => notification.userId === userId);
        
        if (options.unreadOnly) {
          notifications = notifications.filter(notification => !notification.isRead);
        }
        
        // Sort by createdAt and limit
        notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        notifications = notifications.slice(0, options.limit || 20);
        
        return notifications;
      } catch (fallbackError) {
        console.error('Simple fallback query for notifications also failed:', fallbackError);
        return [];
      }
    }
    
    return [];
  }
}

export async function markNotificationAsRead(db: Firestore, notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'userNotifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Community Statistics
export async function getCommunityStats(db: Firestore): Promise<CommunityStats> {
  try {
    // Get basic stats
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const postsSnapshot = await getDocs(collection(db, 'communityPosts'));
    const commentsSnapshot = await getDocs(collection(db, 'postComments'));

    const totalMembers = usersSnapshot.size;
    const totalPosts = postsSnapshot.size;
    const totalComments = commentsSnapshot.size;

    // Calculate active members (users with recent activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeMembers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      return userData.lastLoginAt && userData.lastLoginAt.toDate() > thirtyDaysAgo;
    }).length;

    // Calculate total likes and views
    let totalLikes = 0;
    let totalViews = 0;
    
    postsSnapshot.docs.forEach(doc => {
      const postData = doc.data();
      totalLikes += postData.likes || 0;
      totalViews += postData.views || 0;
    });

    // Calculate growth rate (simplified)
    const growthRate = totalMembers > 0 ? Math.round((totalPosts / totalMembers) * 100) : 0;
    const engagementRate = totalMembers > 0 ? Math.round((totalLikes / totalMembers) * 100) : 0;

    // Get top contributors
    const topContributors = await getTopContributors(db, 5);

    return {
      totalMembers,
      activeMembers,
      totalPosts,
      totalComments,
      totalLikes,
      totalViews,
      totalAchievements: 0, // TODO: Implement achievements
      growthRate,
      engagementRate,
      topContributors,
      trendingTopics: [], // TODO: Implement trending topics
      recentActivity: [], // TODO: Implement recent activity
    };
  } catch (error) {
    console.error('Error getting community stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      totalViews: 0,
      totalAchievements: 0,
      growthRate: 0,
      engagementRate: 0,
      topContributors: [],
      trendingTopics: [],
      recentActivity: [],
    };
  }
}

export async function getTopContributors(db: Firestore, limitCount: number = 10): Promise<UserCommunityProfile[]> {
  try {
    const profilesCollection = collection(db, 'userCommunityProfiles');
    const q = query(
      profilesCollection,
      orderBy('reputation', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserCommunityProfile);
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    return [];
  }
}

// Utility functions
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

export function extractTags(content: string): string[] {
  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  
  return tags;
}

// Following/Followers functionality
export async function followUser(db: Firestore, followerId: string, followingId: string): Promise<void> {
  try {
    const followerRef = doc(db, 'userCommunityProfiles', followerId);
    const followingRef = doc(db, 'userCommunityProfiles', followingId);
    
    // Add to follower's following list
    await updateDoc(followerRef, {
      following: arrayUnion(followingId),
      updatedAt: serverTimestamp(),
    });
    
    // Add to following's followers list
    await updateDoc(followingRef, {
      followers: arrayUnion(followerId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

export async function unfollowUser(db: Firestore, followerId: string, followingId: string): Promise<void> {
  try {
    const followerRef = doc(db, 'userCommunityProfiles', followerId);
    const followingRef = doc(db, 'userCommunityProfiles', followingId);
    
    // Remove from follower's following list
    await updateDoc(followerRef, {
      following: arrayRemove(followingId),
      updatedAt: serverTimestamp(),
    });
    
    // Remove from following's followers list
    await updateDoc(followingRef, {
      followers: arrayRemove(followerId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
}

export async function getFollowingPosts(db: Firestore, userId: string, limitCount: number = 20): Promise<CommunityPost[]> {
  try {
    // Get user's following list
    const userProfile = await getUserCommunityProfile(db, userId);
    if (!userProfile || !userProfile.following || userProfile.following.length === 0) {
      return [];
    }
    
    // Get posts from followed users
    const postsCollection = collection(db, 'communityPosts');
    const q = query(
      postsCollection,
      where('authorId', 'in', userProfile.following),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CommunityPost);
  } catch (error) {
    console.error('Error fetching following posts:', error);
    return [];
  }
}

export async function getFollowers(db: Firestore, userId: string): Promise<UserCommunityProfile[]> {
  try {
    const userProfile = await getUserCommunityProfile(db, userId);
    if (!userProfile || !userProfile.followers || userProfile.followers.length === 0) {
      return [];
    }
    
    const profilesCollection = collection(db, 'userCommunityProfiles');
    const q = query(
      profilesCollection,
      where('uid', 'in', userProfile.followers)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserCommunityProfile);
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
}

export async function getFollowing(db: Firestore, userId: string): Promise<UserCommunityProfile[]> {
  try {
    const userProfile = await getUserCommunityProfile(db, userId);
    if (!userProfile || !userProfile.following || userProfile.following.length === 0) {
      return [];
    }
    
    const profilesCollection = collection(db, 'userCommunityProfiles');
    const q = query(
      profilesCollection,
      where('uid', 'in', userProfile.following)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserCommunityProfile);
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
}

export async function isFollowingUser(db: Firestore, followerId: string, followingId: string): Promise<boolean> {
  try {
    const userProfile = await getUserCommunityProfile(db, followerId);
    return userProfile?.following?.includes(followingId) || false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

export async function getSuggestedUsers(db: Firestore, userId: string, limitCount: number = 10): Promise<UserCommunityProfile[]> {
  try {
    // Get users with high reputation who the current user is not following
    const userProfile = await getUserCommunityProfile(db, userId);
    const following = userProfile?.following || [];
    
    const profilesCollection = collection(db, 'userCommunityProfiles');
    const q = query(
      profilesCollection,
      where('uid', '!=', userId),
      orderBy('reputation', 'desc'),
      limit(limitCount + following.length) // Get extra to filter out following
    );
    
    const querySnapshot = await getDocs(q);
    const allUsers = querySnapshot.docs.map(doc => doc.data() as UserCommunityProfile);
    
    // Filter out users already being followed
    return allUsers.filter(user => !following.includes(user.uid)).slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return [];
  }
}
