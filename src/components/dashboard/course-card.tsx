
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';
// Removed server action import - using API route instead
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { CircularProgress } from '../ui/circular-progress';
import { getCourseImageUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type CourseCardProps = {
  id: string;
  title: string;
  description: string;
  progress: number;
  imageUrl?: string;
  aiHint?: string;
  completed: boolean;
  isEnrolled?: boolean;
  instructorId?: string;
  onEnrollmentChange?: (courseId: string) => void;
  showManagementButtons?: boolean;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
};

function CourseCardComponent({ 
  id, 
  title, 
  description, 
  progress, 
  imageUrl, 
  aiHint, 
  completed, 
  isEnrolled, 
  instructorId,
  onEnrollmentChange,
  showManagementButtons = false,
  onEdit,
  onDelete
}: CourseCardProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDownloadCertificate = () => {
    // Placeholder function. In a real app, this would trigger a download.
    alert('Certificate download is not implemented yet.');
  };

  const handleEnroll = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in to enroll.' });
      return;
    }
    if (!onEnrollmentChange) return;

    setIsEnrolling(true);
    try {
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: id }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const title = result.requiresApproval ? 'Enrollment Request Submitted!' : 'Enrollment Successful!';
        toast({ 
          title, 
          description: result.message || 'You will be notified when your request is approved.' 
        });
        onEnrollmentChange(id);
      } else {
        throw new Error(result.error || result.details || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Enrollment failed', 
        description: error.message || 'Failed to submit enrollment request.'
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    } else {
      // Default behavior - navigate to edit page
      window.location.href = `/formateur/courses/${id}/edit`;
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (onDelete) {
      onDelete(id);
    } else {
      // Default behavior - show toast
      toast({ 
        title: 'Delete Course', 
        description: 'Course deletion functionality needs to be implemented.' 
      });
    }
    setShowDeleteDialog(false);
  };
  
  const displayImageUrl = getCourseImageUrl({ imageUrl: imageUrl || '', title: title });

  const renderFooter = () => {
    if (isEnrolled) {
      if (completed) {
        return (
          <Button className="mt-2 w-full" onClick={handleDownloadCertificate}>
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
        );
      }
      return (
        <Link href={`/courses/${id}`} className="w-full">
          <Button className="mt-2 w-full">
            {progress > 0 ? 'Continue Learning' : 'Start Learning'}
          </Button>
        </Link>
      );
    }
    
    // Hide enrollment button for admin and formateur users - only students can enroll
    if (user?.role === 'admin') {
      return (
        <Button className="mt-2 w-full" variant="outline" disabled>
          View Only - Admin Access
        </Button>
      );
    }
    
    if (user?.role === 'formateur') {
      // For formateurs, show different buttons based on course ownership
      if (instructorId === user.uid) {
        // This is their own course - show management options
        return (
          <div className="flex gap-2 w-full">
            <Button className="flex-1" variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Course
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => window.open(`/courses/${id}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
        );
      } else {
        // This is another instructor's course - show view only
        return (
          <Button className="mt-2 w-full" variant="outline" onClick={() => window.open(`/courses/${id}`, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />
            View Course
          </Button>
        );
      }
    }
    
    // For students - show enrollment button
    return (
      <Button className="mt-2 w-full" onClick={handleEnroll} disabled={isEnrolling}>
        {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isEnrolling ? 'Submitting Request...' : 'Request Enrollment'}
      </Button>
    );
  };

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg group">
        <CardHeader className="p-0 relative">
          <div className="relative h-48 w-full">
            <Image
              src={displayImageUrl}
              alt={title}
              fill
              style={{objectFit:"cover"}}
              data-ai-hint={aiHint || 'course content'}
              onError={() => {
                console.warn('Course image failed to load:', displayImageUrl);
                // The getCourseImageUrl function should handle this, but as a fallback
                // we can set a default placeholder
              }}
            />
            
            {/* Management buttons overlay */}
            {showManagementButtons && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Course
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="mb-2 font-headline text-xl">{title}</CardTitle>
          <CardDescription className="line-clamp-3">{description}</CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4 pt-0">
          {isEnrolled && !completed && (
            <div className="w-full flex justify-center py-2">
              <CircularProgress value={progress} size={80} strokeWidth={8} />
            </div>
          )}
          {renderFooter()}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone and will remove the course permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const CourseCard = React.memo(CourseCardComponent);
