
'use server';

import {createUser} from '@/ai/flows/create-user';
import {redirect} from 'next/navigation';
import type {CreateUserInput} from '@/ai/flows/create-user.schema';
import { sendEmail } from '@/lib/services/email';
import { createNotification, getAdminUserIds } from '@/lib/services/notifications';
import { getAdminServices } from '@/lib/firebase-admin';

export async function signup(prevState: any, formData: FormData): Promise<{message?: string}> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !firstName || !lastName || !role) {
    return {message: 'All fields are required.'};
  }
  
  if (password.length < 6) {
    return {message: 'Password must be at least 6 characters long.'};
  }

  try {
    const displayName = `${firstName} ${lastName}`;
    const userInput: CreateUserInput = {
      email,
      password,
      displayName,
      role,
    };
    await createUser(userInput);

    // --- Send Welcome Email to New User ---
    await sendEmail({
        to: email,
        subject: 'Welcome to EduVerse!',
        html: `<h1>Hi ${firstName},</h1><p>Welcome to EduVerse! Your account has been created successfully. You can now log in and start learning.</p>`,
    });

    // --- Send Notification Email & Create In-App Notification for Admins ---
    const { auth } = getAdminServices();
    const adminUsers = await getAdminUserIds();
    const adminEmails = (await Promise.all(adminUsers.map(id => auth.getUser(id)))).map(u => u.email).filter(e => e);

    for (const adminEmail of adminEmails) {
        await sendEmail({
            to: adminEmail,
            subject: 'New User Registration',
            html: `<p>A new user has signed up on the platform:</p><ul><li>Name: ${displayName}</li><li>Email: ${email}</li><li>Role: ${role}</li></ul>`,
        });
    }

    for (const adminId of adminUsers) {
        await createNotification({
            userId: adminId,
            title: 'New User Signup',
            message: `A new user, ${displayName} (${email}), has signed up as a ${role}.`,
            link: `/admin`, 
        });
    }


  } catch (e: any) {
    // Firebase auth errors have a code property
    if (e.message?.includes('auth/email-already-exists') || e.message?.includes('auth/email-already-in-use')) {
      return {message: 'This email is already in use.'};
    }
    return {message: e.message || 'An unexpected error occurred.'};
  }

  redirect('/login');
}
