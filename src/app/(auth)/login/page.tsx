'use client';
import {useState} from 'react';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {setAuthCookie} from './actions';
import {useRouter} from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { services } = useAuth();

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!services) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(services.auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const res = await setAuthCookie(idToken);

      if (res?.success) {
        router.push('/');
        router.refresh(); // Force a refresh to re-evaluate auth state
      } else {
        setError(res?.message || 'An unknown error occurred during cookie setting.');
      }
    } catch (error: any) {
      console.error('Email Sign-In Error:', error);
      setError(error.message);
    }
  };
  
  if (!services) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <Card className="mx-auto max-w-sm border-0 shadow-lg sm:border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-center text-sm text-destructive">{error}</p>}
        <form onSubmit={handleEmailLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" name="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
