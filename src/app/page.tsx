
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // If there is no token, go to login
  const cookieStore = await cookies();
  const token = cookieStore.get('AuthToken')?.value;
  if (!token) {
    redirect('/login');
  }
  // Default landing based on client claims would be done client-side.
  // Server cannot read role from cookies here without verifying the token.
  redirect('/student/dashboard');
}
