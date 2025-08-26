'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Pin, 
  MoreHorizontal, 
  ImageIcon,
  Video,
  FileText,
  Hash,
  AtSign,
  Send,
  Loader2,
  Trash2,
  Edit3,
  Flag,
  Camera,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  createCommunityPost,
  getCommunityPosts,
  createPostComment,
  getPostComments,
  likePost,
  viewPost,
  extractMentions,
  extractTags,
  getUserCommunityProfile,
  createUserCommunityProfile,
  pinPost,
  hasUserLikedPost
} from '@/lib/services/community';
import { uploadMultipleToCloudinary } from '@/lib/services/cloudinary';
import type { CommunityPost, PostComment, UserCommunityProfile, PostMedia } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { InstagramPostCard } from '@/components/community/instagram-post-card';

function CommunityFeedContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'general' | 'question' | 'showcase' | 'discussion' | 'announcement'>('general');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserCommunityProfile | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('trending');

  // Fetch posts and user profile
  const fetchPosts = useCallback(async () => {
    if (!services?.db) return;
    
    try {
      setLoading(true);
      const postsData = await getCommunityPosts(services.db, { limit: 20 });
      
      // Check if current user has liked each post
      if (user) {
        const postsWithLikeStatus = await Promise.all(
          postsData.map(async (post) => {
            const hasLiked = await hasUserLikedPost(services.db, post.id, user.uid);
            return {
              ...post,
              liked: hasLiked
            };
          })
        );
        setPosts(postsWithLikeStatus);
      } else {
        setPosts(postsData);
      }
      
      // Fetch comments for each post
      const commentsData: Record<string, PostComment[]> = {};
      for (const post of postsData) {
        const postComments = await getPostComments(services.db, post.id);
        commentsData[post.id] = postComments;
      }
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load community posts',
      });
    } finally {
      setLoading(false);
    }
  }, [services?.db, user, toast]);

  const fetchUserProfile = useCallback(async () => {
    if (!services?.db || !user) return;
    
    try {
      let profile = await getUserCommunityProfile(services.db, user.uid);
      if (!profile) {
        // Create profile if it doesn't exist
        await createUserCommunityProfile(services.db, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Anonymous',
          role: user.role || 'student',
          avatar: user.photoURL || null,
          bio: '',
          status: 'active',
        });
        profile = await getUserCommunityProfile(services.db, user.uid);
      }
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [services?.db, user]);



  useEffect(() => {
    fetchPosts();
    fetchUserProfile();
  }, [fetchPosts, fetchUserProfile]);

  // Create new post
  const handleCreatePost = async () => {
    if (!services?.db || !user || !newPostContent.trim()) return;
    
    try {
      setCreatingPost(true);
      const mentions = extractMentions(newPostContent);
      const tags = extractTags(newPostContent);
      
      // Upload files if any are selected
      const media = await uploadFiles();
      
      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        content: newPostContent,
        media,
        tags,
        mentions,
        category: newPostCategory,
      };
      
      // Only add authorAvatar if it has a value
      if (user.photoURL) {
        postData.authorAvatar = user.photoURL;
      }
      
      await createCommunityPost(services.db, postData);
      
      setNewPostContent('');
      setNewPostCategory('general');
      setSelectedFiles([]);
      setShowCreatePost(false);
      
      toast({
        title: 'Post Created',
        description: 'Your post has been published successfully!',
      });
      
      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create post',
      });
    } finally {
      setCreatingPost(false);
    }
  };

  // Add comment
  const handleAddComment = async (postId: string) => {
    if (!services?.db || !user || !newCommentContent.trim()) return;
    
    try {
      const mentions = extractMentions(newCommentContent);
      
      const commentData: any = {
        postId,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        content: newCommentContent,
        media: [],
        mentions,
        parentCommentId: replyingTo || undefined,
      };
      
      // Only add authorAvatar if it has a value
      if (user.photoURL) {
        commentData.authorAvatar = user.photoURL;
      }
      
      await createPostComment(services.db, commentData);
      
      setNewCommentContent('');
      setReplyingTo(null);
      
      // Refresh comments for this post
      const updatedComments = await getPostComments(services.db, postId);
      setComments(prev => ({
        ...prev,
        [postId]: updatedComments,
      }));
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted!',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add comment',
      });
    }
  };

  // Like/unlike post
  const handleLikePost = async (postId: string) => {
    if (!services?.db || !user || likingPosts.has(postId)) return;
    
    try {
      setLikingPosts(prev => new Set(prev).add(postId));
      await likePost(services.db, postId, user.uid);
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + (post.liked ? -1 : 1), liked: !post.liked }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update like',
      });
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Pin/Unpin post
  const handlePinPost = async (postId: string) => {
    if (!services?.db || !user) return;
    
    try {
      // Toggle pin status in the database
      await pinPost(services.db, postId, user.uid);
      
      // Re-fetch posts to get the correct sorted order
      await fetchPosts();
      
      // Show success message
      const updatedPost = posts.find(p => p.id === postId);
      const isPinned = updatedPost ? !updatedPost.isPinned : false;
      
      toast({
        title: isPinned ? "Post Pinned!" : "Post Unpinned!",
        description: isPinned ? "Post has been pinned to the top." : "Post has been unpinned.",
      });
    } catch (error) {
      console.error('Error pinning/unpinning post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to pin/unpin post. Please try again.',
      });
    }
  };

  // Record post view
  const handleViewPost = async (postId: string) => {
    if (!services?.db || !user) return;
    
    try {
      await viewPost(services.db, postId, user.uid);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to Cloudinary
  const uploadFiles = async (): Promise<PostMedia[]> => {
    if (selectedFiles.length === 0) return [];
    
    setUploadingFiles(true);
    const uploadedMedia: PostMedia[] = [];
    
    try {
      const cloudinaryResults = await uploadMultipleToCloudinary(selectedFiles);
      for (let i = 0; i < cloudinaryResults.length; i++) {
        const result = cloudinaryResults[i];
        const file = selectedFiles[i];
        
        // Determine media type based on file type and Cloudinary resource_type
        let mediaType: 'image' | 'video' | 'file' = 'file';
        if (result.resource_type === 'image') {
          mediaType = 'image';
        } else if (result.resource_type === 'video') {
          mediaType = 'video';
        } else if (file.type.startsWith('image/')) {
          mediaType = 'image';
        } else if (file.type.startsWith('video/')) {
          mediaType = 'video';
        }
        
        const media: PostMedia = {
          id: result.public_id,
          type: mediaType,
          url: result.secure_url,
          filename: file.name,
          size: result.bytes,
          alt: file.name,
          width: result.width,
          height: result.height,
        };
        uploadedMedia.push(media);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload files to Cloudinary',
      });
    } finally {
      setUploadingFiles(false);
    }
    
    return uploadedMedia;
  };

  if (loading) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Instagram-like Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Community Feed
              </h1>
              <p className="text-sm text-muted-foreground">
                Share your journey, inspire others
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreatePost(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Camera className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Instagram-like Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background border border-border">
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trending</span>
          </TabsTrigger>
          <TabsTrigger value="latest" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Latest</span>
          </TabsTrigger>
          <TabsTrigger value="pinned" className="flex items-center gap-2">
            <Pin className="h-4 w-4" />
            <span className="hidden sm:inline">Pinned</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading trending posts...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts
                .filter(post => {
                  // Trending algorithm: posts with high engagement (likes + comments + views)
                  const engagement = post.likes + post.comments + (post.views || 0);
                  const isRecent = new Date(post.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days
                  return engagement > 3 && isRecent;
                })
                .sort((a, b) => {
                  // Sort by engagement score
                  const scoreA = (a.likes * 2) + a.comments + (a.views || 0);
                  const scoreB = (b.likes * 2) + b.comments + (b.views || 0);
                  return scoreB - scoreA;
                })
              .map((post) => (
                <InstagramPostCard
                  key={post.id}
                  post={post}
                  comments={comments[post.id] || []}
                  user={user}
                  onLike={handleLikePost}
                  onPin={handlePinPost}
                  onAddComment={handleAddComment}
                  onView={handleViewPost}
                  likingPosts={likingPosts}
                  newCommentContent={newCommentContent}
                  setNewCommentContent={setNewCommentContent}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))}
          </div>
          )}
          {!loading && posts.filter(post => {
            const engagement = post.likes + post.comments + (post.views || 0);
            const isRecent = new Date(post.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
            return engagement > 3 && isRecent;
          }).length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Trending Posts</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create engaging content!
              </p>
              <Button onClick={() => setShowCreatePost(true)}>
                Create Your First Post
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="latest" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading latest posts...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((post) => (
                <InstagramPostCard
                  key={post.id}
                  post={post}
                  comments={comments[post.id] || []}
                  user={user}
                  onLike={handleLikePost}
                  onPin={handlePinPost}
                  onAddComment={handleAddComment}
                  onView={handleViewPost}
                  likingPosts={likingPosts}
                  newCommentContent={newCommentContent}
                  setNewCommentContent={setNewCommentContent}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))}
          </div>
          )}
          {!loading && posts.length === 0 && (
          <div className="text-center py-12">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
            <p className="text-muted-foreground mb-4">
                Be the first to share something with the community!
            </p>
              <Button onClick={() => setShowCreatePost(true)}>
                Create Your First Post
              </Button>
          </div>
          )}
        </TabsContent>



        <TabsContent value="pinned" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading pinned posts...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts
              .filter(post => post.isPinned)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((post) => (
                <InstagramPostCard
                  key={post.id}
                  post={post}
                  comments={comments[post.id] || []}
                  user={user}
                  onLike={handleLikePost}
                  onPin={handlePinPost}
                  onAddComment={handleAddComment}
                  onView={handleViewPost}
                  likingPosts={likingPosts}
                  newCommentContent={newCommentContent}
                  setNewCommentContent={setNewCommentContent}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))}
          </div>
          )}
          {!loading && posts.filter(post => post.isPinned).length === 0 && (
            <div className="text-center py-12">
              <Pin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Pinned Posts</h3>
              <p className="text-muted-foreground mb-4">
                Important posts will appear here when pinned by moderators.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Create a New Post
            </DialogTitle>
            <DialogDescription>
              Share your thoughts, questions, or showcase your work with the community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={newPostCategory} onValueChange={(value: any) => setNewPostCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="showcase">Showcase</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? Use @username to mention someone or #tag for topics..."
                rows={6}
                className="resize-none"
              />
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <AtSign className="h-4 w-4" />
                <span>Mention users with @username</span>
                <Hash className="h-4 w-4 ml-2" />
                <span>Add tags with #topic</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFiles}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {uploadingFiles ? 'Uploading...' : 'Add Media'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              
              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Files:</p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePost} 
              disabled={creatingPost || !newPostContent.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {creatingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CommunityFeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <CommunityFeedContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
