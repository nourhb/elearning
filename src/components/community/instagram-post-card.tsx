'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Pin, 
  MoreHorizontal, 
  FileText,
  Send,
  Trash2,
  Edit3,
  Flag,
  Bookmark,
  Share2,
  Lightbulb,
  Trophy,
  Users,
  Zap,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CommunityPost, PostComment, PostMedia } from '@/lib/types';

interface InstagramPostCardProps {
  post: CommunityPost;
  comments: PostComment[];
  user: any;
  onLike: (postId: string) => void;
  onPin: (postId: string) => void;
  onAddComment: (postId: string) => void;
  onView: (postId: string) => void;
  likingPosts: Set<string>;
  newCommentContent: string;
  setNewCommentContent: (content: string) => void;
  replyingTo: string | null;
  setReplyingTo: (postId: string | null) => void;
}

export function InstagramPostCard({
  post,
  comments,
  user,
  onLike,
  onPin,
  onAddComment,
  onView,
  likingPosts,
  newCommentContent,
  setNewCommentContent,
  replyingTo,
  setReplyingTo,
}: InstagramPostCardProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  const formatContent = (content: string) => {
    let formattedContent = content.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
    formattedContent = formattedContent.replace(/#(\w+)/g, '<span class="text-green-500 font-medium">#$1</span>');
    return formattedContent;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <Lightbulb className="h-4 w-4" />;
      case 'showcase': return <Trophy className="h-4 w-4" />;
      case 'discussion': return <Users className="h-4 w-4" />;
      case 'announcement': return <Zap className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'showcase': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'discussion': return 'bg-green-100 text-green-700 border-green-200';
      case 'announcement': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="overflow-hidden hover-lift border-border shadow-modern">
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 avatar-modern">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {getInitials(post.authorName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{post.authorName}</p>
                <Badge variant="outline" className={`text-xs ${getCategoryColor(post.category)}`}>
                  {getCategoryIcon(post.category)}
                  <span className="ml-1 capitalize">{post.category}</span>
                </Badge>
                {post.isPinned && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.uid === post.authorId && (
                <>
                  <DropdownMenuItem>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {/* Post Content */}
      <CardContent className="pt-0">
        <div 
          className="mb-4 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />
        
        {/* Media content */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4">
            <div className="grid gap-2">
              {post.media.map((media: PostMedia) => (
                <div key={media.id} className="relative">
                  {media.type === 'image' && (
                    <div className="relative group">
                      <img
                        src={media.url}
                        alt={media.alt || 'Post image'}
                        className="w-full h-auto max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => {
                          window.open(media.url, '_blank');
                        }}
                      />
                      {media.alt && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {media.alt}
                        </div>
                      )}
                    </div>
                  )}
                  {media.type === 'video' && (
                    <div className="relative">
                      <video
                        src={media.url}
                        controls
                        className="w-full h-auto max-h-96 object-cover rounded-lg"
                        poster={media.thumbnailUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {media.alt && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {media.alt}
                        </div>
                      )}
                    </div>
                  )}
                  {media.type === 'file' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {media.filename || 'File'}
                        </p>
                        {media.size && (
                          <p className="text-xs text-muted-foreground">
                            {(media.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(media.url, '_blank')}
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Interaction buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(post.id)}
            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-500"
            disabled={likingPosts.has(post.id)}
          >
            <Heart className={`h-4 w-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{post.likes}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-500"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-500"
            onClick={() => onPin(post.id)}
          >
            <Pin className={`h-4 w-4 ${post.isPinned ? 'fill-purple-500 text-purple-500' : ''}`} />
            <span>{post.isPinned ? 'Pinned' : 'Pin'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-yellow-50 hover:text-yellow-500 ml-auto"
          >
            <Bookmark className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-green-50 hover:text-green-500"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Comments section */}
        <div className="mt-4 space-y-3">
          {comments.slice(0, 3).map((comment: PostComment) => (
            <div key={comment.id} className="flex gap-3 pl-4 border-l-2 border-muted">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.authorAvatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{comment.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          
          {/* Add comment */}
          {replyingTo === post.id && (
            <div className="flex gap-3 pl-4 border-l-2 border-muted">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.photoURL} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.displayName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onAddComment(post.id);
                    }
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAddComment(post.id)}
                    disabled={!newCommentContent.trim()}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
