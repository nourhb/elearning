
'use client';

import {useAuth} from '@/hooks/use-auth';
import {useRouter} from 'next/navigation';

export default function StudentPage() {
  const {user, loading} = useAuth();
  const router = useRouter();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user || user.role !== 'student') {
    router.push('/login');
    return null;
  }

  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Welcome, {user.email}!</p>
    </div>
  );
}
