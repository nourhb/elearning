'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FixResult {
  courseId: string;
  title: string;
  oldUrl?: string;
  newUrl?: string;
  error?: string;
  status: 'fixed' | 'skipped' | 'error';
}

export default function FixAllImagesPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const handleFixAllImages = async () => {
    setIsFixing(true);
    setResults([]);
    setStats(null);

    try {
      const response = await fetch('/api/admin/fix-all-course-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        setStats(data.stats);
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fixed':
        return 'text-green-600';
      case 'skipped':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Fix All Course Images
          </CardTitle>
          <CardDescription>
            This tool will scan all courses in the database and fix any broken or invalid image URLs.
            It will replace blob URLs and invalid URLs with proper placeholder images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleFixAllImages} 
            disabled={isFixing}
            className="w-full"
            size="lg"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing All Course Images...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fix All Course Images
              </>
            )}
          </Button>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.fixed}</div>
                <div className="text-sm text-muted-foreground">Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Results</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>
                        {result.status === 'fixed' && `Fixed: ${result.oldUrl} → ${result.newUrl}`}
                        {result.status === 'skipped' && 'Already correct'}
                        {result.status === 'error' && `Error: ${result.error}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>What this tool does:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Scans all courses in the database</li>
              <li>Identifies courses with blob URLs or invalid image URLs</li>
              <li>Replaces broken URLs with proper placeholder images</li>
              <li>Updates the database in a single batch operation</li>
              <li>Provides detailed results for each course</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
