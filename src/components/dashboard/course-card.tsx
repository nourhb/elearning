
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
import { Download, Loader2 } from 'lucide-react';
import { enrollInCourseAction } from '@/app/admin/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { CircularProgress } from '../ui/circular-progress';
import { getCourseImageUrl } from '@/lib/utils';

type CourseCardProps = {
  id: string;
  title: string;
  description: string;
  progress: number;
  imageUrl?: string;
  aiHint?: string;
  completed: boolean;
  isEnrolled?: boolean;
  onEnrollmentChange?: (courseId: string) => void;
};

function CourseCardComponent({ id, title, description, progress, imageUrl, aiHint, completed, isEnrolled, onEnrollmentChange }: CourseCardProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
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
      const result = await enrollInCourseAction(user.uid, id);
      if (result.success) {
        toast({ title: 'Successfully enrolled!', description: 'You can now start the course.' });
        onEnrollmentChange(id);
      } else {
        throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Enrollment failed', description: error.message });
    } finally {
      setIsEnrolling(false);
    }
  };
  
  const displayImageUrl = getCourseImageUrl({ imageUrl: imageUrl || '' });

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
    return (
      <Button className="mt-2 w-full" onClick={handleEnroll} disabled={isEnrolling}>
        {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
      </Button>
    );
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={displayImageUrl}
            alt={title}
            fill
            style={{objectFit:"cover"}}
            data-ai-hint={aiHint || 'course content'}
          />
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
  );
}

export const CourseCard = React.memo(CourseCardComponent);
