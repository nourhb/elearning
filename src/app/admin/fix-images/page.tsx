'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export default function FixImagesPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFixImages = async () => {
    setIsFixing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-course-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.message);
        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        const errorMessage = data.error || data.details || 'Failed to fix course images';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred';
      setResult(`Error: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Fix Course Images
          </CardTitle>
          <CardDescription>
            This tool will fix course images by replacing blob URLs and invalid image URLs with proper placeholder images.
            Blob URLs are temporary and become invalid when the browser session changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleFixImages} 
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Images...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fix Course Images
              </>
            )}
          </Button>

          {result && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{result}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Scans all courses in the database</li>
              <li>Identifies courses with blob URLs or invalid image URLs</li>
              <li>Replaces blob URLs and invalid URLs with placeholder images</li>
              <li>Updates the database in a single batch operation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
