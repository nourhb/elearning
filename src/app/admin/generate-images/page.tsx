'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface GenerateResult {
  courseId: string;
  title: string;
  oldUrl?: string;
  newUrl?: string;
  error?: string;
  status: 'generated' | 'skipped' | 'error';
}

export default function GenerateImagesPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerateImages = async () => {
    setIsGenerating(true);
    setResults([]);
    setStats(null);

    try {
      const response = await fetch('/api/admin/generate-course-images', {
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
        const errorMessage = data.error || data.details || 'Failed to generate course images';
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
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
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
      case 'generated':
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
            <Image className="h-5 w-5" />
            Generate Course Images
          </CardTitle>
          <CardDescription>
            This tool will generate beautiful, relevant images for all your courses based on their titles.
            It uses high-quality Unsplash images that match each course's subject matter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleGenerateImages} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Course Images...
              </>
            ) : (
              <>
                <Image className="mr-2 h-4 w-4" />
                Generate Course Images
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
                <div className="text-2xl font-bold text-green-600">{stats.generated}</div>
                <div className="text-sm text-muted-foreground">Generated</div>
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
                        {result.status === 'generated' && `Generated: ${result.oldUrl} → ${result.newUrl}`}
                        {result.status === 'skipped' && 'Already has good image'}
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
              <li>Analyzes course titles to determine subject matter</li>
              <li>Generates relevant high-quality images from Unsplash</li>
              <li>Replaces placeholder images and blob URLs</li>
              <li>Updates the database with beautiful course images</li>
            </ul>
            
            <p className="mt-4"><strong>Image Categories:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>AI/Machine Learning:</strong> Neural network and AI imagery</li>
              <li><strong>React/Next.js:</strong> Modern web development visuals</li>
              <li><strong>Python/Data Science:</strong> Data analysis and programming</li>
              <li><strong>Cybersecurity:</strong> Security and protection themes</li>
              <li><strong>UX/Design:</strong> Design and creativity visuals</li>
              <li><strong>Math:</strong> Mathematical and analytical imagery</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
