
'use server';

import {cookies} from 'next/headers';

export async function setAuthCookie(idToken: string): Promise<{ success: boolean; message?: string }> {
  try {
    const cookieStore = await cookies();
    cookieStore.set('AuthToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    return { success: true };
  } catch (e: any) {
    console.error('Failed to set auth cookie:', e);
    return { success: false, message: e.message || 'An unknown error occurred while setting session.' };
  }
}
