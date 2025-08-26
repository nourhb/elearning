'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

export function StorageTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testStorage = async () => {
    if (!user) {
      setTestResult('❌ User not authenticated');
      return;
    }

    setIsTesting(true);
    setTestResult('🔄 Testing Firebase Storage...');

    try {
      // Test 1: Initialize storage
      console.log('Test 1: Initializing storage...');
      const storage = getStorage(app);
      console.log('Storage initialized:', storage);
      setTestResult('✅ Storage initialized successfully\n');

      // Test 2: Create a test file
      console.log('Test 2: Creating test file...');
      const testContent = 'This is a test file for Firebase Storage';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      console.log('Test file created:', testFile);
      setTestResult(prev => prev + '✅ Test file created\n');

      // Test 3: Upload file
      console.log('Test 3: Uploading test file...');
      const filePath = `test/${user.uid}/test-${Date.now()}.txt`;
      const storageRef = ref(storage, filePath);
      console.log('Storage reference created:', filePath);
      setTestResult(prev => prev + '✅ Storage reference created\n');

      const snapshot = await uploadBytes(storageRef, testFile);
      console.log('Upload completed:', snapshot);
      setTestResult(prev => prev + '✅ File uploaded successfully\n');

      // Test 4: Get download URL
      console.log('Test 4: Getting download URL...');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadUrl);
      setTestResult(prev => prev + '✅ Download URL obtained\n');

      // Test 5: Verify URL is accessible
      console.log('Test 5: Verifying URL accessibility...');
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const content = await response.text();
        console.log('File content retrieved:', content);
        setTestResult(prev => prev + '✅ File content verified\n');
      } else {
        throw new Error('Failed to access uploaded file');
      }

      setTestResult(prev => prev + '\n🎉 All tests passed! Firebase Storage is working correctly.');
      console.log('All storage tests passed!');

    } catch (error: any) {
      console.error('Storage test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}\n\nError code: ${error.code}\n\nPlease check the console for more details.`);
    } finally {
      setIsTesting(false);
    }
  };

  const checkAuth = () => {
    if (!user) {
      setTestResult('❌ User not authenticated. Please log in first.');
      return;
    }
    setTestResult(`✅ User authenticated\nUser ID: ${user.uid}\nEmail: ${user.email}`);
  };

  const checkFirebaseConfig = () => {
    try {
      const storage = getStorage(app);
      const bucket = storage.app.options.storageBucket;
      setTestResult(`✅ Firebase config check:\nStorage Bucket: ${bucket}\nProject ID: ${storage.app.options.projectId}`);
    } catch (error: any) {
      setTestResult(`❌ Firebase config error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Firebase Storage Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkAuth} variant="outline" size="sm">
            Check Auth
          </Button>
          <Button onClick={checkFirebaseConfig} variant="outline" size="sm">
            Check Config
          </Button>
          <Button onClick={testStorage} disabled={isTesting || !user}>
            {isTesting ? 'Testing...' : 'Run Storage Test'}
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <pre className="text-sm whitespace-pre-wrap">{testResult || 'No tests run yet.'}</pre>
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>First, check if you're authenticated</li>
            <li>Then verify your Firebase configuration</li>
            <li>Finally, run the storage test</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

