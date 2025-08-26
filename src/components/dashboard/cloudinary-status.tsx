'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export function CloudinaryStatus() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [configDetails, setConfigDetails] = useState<{
    cloudName: string | undefined;
    apiKey: string | undefined;
    uploadPreset: string | undefined;
  }>({
    cloudName: undefined,
    apiKey: undefined,
    uploadPreset: undefined,
  });

  useEffect(() => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    setConfigDetails({
      cloudName,
      apiKey,
      uploadPreset,
    });

    setIsConfigured(!!(cloudName && uploadPreset));
  }, []);

  const getStatusIcon = () => {
    if (isConfigured) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    if (isConfigured) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Configured</Badge>;
    } else {
      return <Badge variant="destructive">Not Configured</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Cloudinary Status
        </CardTitle>
        <CardDescription>
          Check if Cloudinary is properly configured for image uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Cloud Name:</span>
            <span className="text-sm font-mono">
              {configDetails.cloudName ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">API Key:</span>
            <span className="text-sm font-mono">
              {configDetails.apiKey ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Upload Preset:</span>
            <span className="text-sm font-mono">
              {configDetails.uploadPreset ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Cloudinary not configured</p>
                <p className="mt-1">Follow the setup guide to configure Cloudinary for production use.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://cloudinary.com/', '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('/QUICK_CLOUDINARY_SETUP.md', '_blank')}
            className="flex-1"
          >
            Setup Guide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
