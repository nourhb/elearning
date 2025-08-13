
'use server';

import { getAdminServices } from '@/lib/firebase-admin';
import type { Course, UserProfile } from '@/lib/types';
import { seedDatabase } from '@/ai/flows/seed-database';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { deleteUser as deleteUserFlow } from '@/ai/flows/delete-user';
import { sendEmail } from '@/lib/services/email';
import { createNotification, getAdminUserIds } from '@/lib/services/notifications';


export async function getAdminDashboardData(): Promise<{ users: UserProfile[], courses: Course[] }> {
    try {
        const { db } = getAdminServices();

        const usersCollection = db.collection('users');
        const usersSnapshot = await usersCollection.get();
        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as UserProfile;
        });

        const coursesCollection = db.collection('courses');
        const coursesSnapshot = await coursesCollection.get();
        const courses = coursesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as Course;
        });

        return { users, courses };
    } catch (error) {
        // Gracefully degrade when admin credentials are missing or invalid
        return { users: [], courses: [] };
    }
}

export async function approveCourseAction(courseId: string): Promise<void> {
    const { db } = getAdminServices();
    const courseDocRef = db.collection('courses').doc(courseId);
    await courseDocRef.update({ status: 'Published' });
}

export async function seedDatabaseAction(): Promise<string> {
    try {
        const result = await seedDatabase();

        // --- Send Test Email to Admins ---
        const { auth } = getAdminServices();
        const adminUsers = await getAdminUserIds();
        const adminEmails = (await Promise.all(adminUsers.map(id => auth.getUser(id)))).map(u => u.email).filter(e => e);

        for (const adminEmail of adminEmails) {
            await sendEmail({
                to: adminEmail,
                subject: 'Test Email: Notification System Works!',
                html: `<p>This is a test email to confirm that the email notification system is working correctly.</p><p>This email was triggered by the "Seed Database" action.</p>`,
            });
        }
        // --- End Test Email ---
        
        return result;
    } catch (error: any) {
        throw new Error(error.message || 'An unknown error occurred while seeding the database.');
    }
}

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['student', 'formateur']),
  courseIds: z.array(z.string()),
  creatorId: z.string(), // UID of the admin/formateur creating the user
});

/**
 * Assigns one or more courses to a user by creating progress documents.
 * This is a server-only action.
 * @param userId - The ID of the user to enroll.
 * @param courseIds - An array of course IDs to assign.
 */
async function assignCoursesToUser(userId: string, courseIds: string[]): Promise<Course[]> {
    if (courseIds.length === 0) return [];
    const { db } = getAdminServices();
    const batch = db.batch();

    const assignedCourses: Course[] = [];

    // Fetch course details to include in notifications
    for (const courseId of courseIds) {
        const courseRef = db.collection('courses').doc(courseId);
        const courseSnap = await courseRef.get();
        if (courseSnap.exists) {
            assignedCourses.push({ id: courseSnap.id, ...courseSnap.data() } as Course);
            const progressDocRef = db.collection('progress').doc();
            batch.set(progressDocRef, {
                userId,
                courseId,
                progress: 0,
                completed: false,
                completedLessons: [],
                startedAt: new Date(),
            });
        }
    }


    await batch.commit();
    return assignedCourses;
}


export async function createUserAndAssignCoursesAction(prevState: any, formData: FormData) {
  const { db, auth } = getAdminServices();
  const courseIdsString = formData.get('courseIds') as string;
  let courseIds = [];
  try {
    courseIds = JSON.parse(courseIdsString);
  } catch (error) {
    return { message: 'Invalid course selection.' };
  }

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    courseIds,
    creatorId: formData.get('creatorId'),
  };
  
  const validationResult = createUserSchema.safeParse(rawData);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.flatten().fieldErrors;
    return {
      message: 'Validation failed.',
      errors: {
        firstName: errorMessages.firstName?.[0],
        lastName: errorMessages.lastName?.[0],
        email: errorMessages.email?.[0],
        password: errorMessages.password?.[0],
        role: errorMessages.role?.[0],
      },
    };
  }
  
  const { firstName, lastName, email, password, role, creatorId } = validationResult.data;
  const displayName = `${firstName} ${lastName}`;
  
  let newUserUid: string;
  
  try {
    const userRecord = await auth.createUser({ email, password, displayName });
    newUserUid = userRecord.uid;

    await auth.setCustomUserClaims(newUserUid, { role });

    await db.collection('users').doc(newUserUid).set({
        email,
        displayName,
        role,
        status: 'active',
        createdAt: new Date(),
        createdBy: creatorId,
    });
    
    // --- Send Welcome Email to New User ---
    await sendEmail({
        to: email,
        subject: 'Welcome to EduVerse!',
        html: `<h1>Hi ${firstName},</h1><p>Welcome to EduVerse! Your account has been created successfully. You can now log in and start learning.</p>`,
    });

    // --- Send Notification Email to Admins ---
    const adminUsers = await getAdminUserIds();
    const adminEmails = (await Promise.all(adminUsers.map(id => auth.getUser(id)))).map(u => u.email).filter(e => e);

    for (const adminEmail of adminEmails) {
        await sendEmail({
            to: adminEmail,
            subject: 'New User Registration',
            html: `<p>A new user has registered on the platform:</p><ul><li>Name: ${displayName}</li><li>Email: ${email}</li><li>Role: ${role}</li></ul>`,
        });
    }

    // --- Create In-App Notification for Admins ---
     for (const adminId of adminUsers) {
        await createNotification({
            userId: adminId,
            title: 'New User',
            message: `A new user, ${displayName} (${email}), has signed up as a ${role}.`,
            link: `/admin`,
        });
    }


  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        return { message: 'This email is already in use.', errors: { email: 'Email already exists.' } };
    }
    console.error("Error creating user:", error);
    return { message: 'Failed to create user account.' };
  }
  
  try {
    if (validationResult.data.courseIds.length > 0 && role === 'student') {
        const assignedCourses = await assignCoursesToUser(newUserUid, validationResult.data.courseIds);
        
        // --- Send Course Enrollment Email to Student ---
        const courseListHtml = assignedCourses.map(c => `<li>${c.title}</li>`).join('');
        await sendEmail({
            to: email,
            subject: 'You have been enrolled in new courses!',
            html: `<h1>Hi ${firstName},</h1><p>You have been enrolled in the following courses:</p><ul>${courseListHtml}</ul><p>Happy learning!</p>`,
        });

        // --- Send Notification Email to Admins about Enrollment ---
        const adminUsers = await getAdminUserIds();
        const adminEmails = (await Promise.all(adminUsers.map(id => auth.getUser(id)))).map(u => u.email).filter(e => e);
        for (const adminEmail of adminEmails) {
             await sendEmail({
                to: adminEmail,
                subject: 'Course Enrollment',
                html: `<p>The user ${displayName} (${email}) has been enrolled in ${assignedCourses.length} course(s):</p><ul>${courseListHtml}</ul>`,
            });
        }
        
         // --- Create In-App Notification for Admins ---
        for (const adminId of adminUsers) {
            await createNotification({
                userId: adminId,
                title: 'Course Enrollment',
                message: `${displayName} was enrolled in ${assignedCourses.length} course(s).`,
                link: `/admin`,
            });
        }
    }
    
    revalidatePath('/admin');
    revalidatePath('/formateur');
    return { success: true, message: 'User created successfully.' };

  } catch (error: any) {
    console.error("Error assigning courses:", error);
    return { message: 'User created, but failed to assign courses.' };
  }
}

export async function deleteUser(uid: string): Promise<{success: boolean, message?: string}> {
    try {
        await deleteUserFlow({uid});
        revalidatePath('/admin');
        return {success: true};
    } catch (error: any) {
        return {success: false, message: error.message};
    }
}

interface UpdateUserParams {
    uid: string;
    role: 'admin' | 'formateur' | 'student';
    status: 'active' | 'suspended';
    courseIds: string[];
}

export async function updateUserAction(params: UpdateUserParams) {
  const { uid, role, status, courseIds } = params;
  const { auth, db } = getAdminServices();

  if (!uid || !role || !status) {
    throw new Error('Missing required user information.');
  }

  try {
    // 1. Update Role (Auth Claim + Firestore)
    await auth.setCustomUserClaims(uid, { role });
    
    // 2. Update Status (Auth Disabled Flag + Firestore)
    const disabled = status === 'suspended';
    await auth.updateUser(uid, { disabled });

    // 3. Update User Document in Firestore
    await db.collection('users').doc(uid).update({ role, status });

    // 4. Update Course Assignments
    const progressRef = db.collection('progress');
    const q = progressRef.where('userId', '==', uid);
    
    const existingProgressSnap = await q.get();
    const existingProgress = existingProgressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const existingCourseIds = new Set(existingProgress.map(p => p.courseId));
    const newCourseIdsSet = new Set(courseIds);

    const coursesToUnenroll = existingProgress.filter(p => !newCourseIdsSet.has(p.courseId));
    const coursesToEnrollIds = courseIds.filter(id => !existingCourseIds.has(id));

    if (coursesToUnenroll.length > 0 || coursesToEnrollIds.length > 0) {
        const batch = db.batch();

        coursesToUnenroll.forEach(progressDoc => {
          batch.delete(db.collection('progress').doc(progressDoc.id));
        });
        
        let enrolledCourses: Course[] = [];
        if (coursesToEnrollIds.length > 0) {
             enrolledCourses = await assignCoursesToUser(uid, coursesToEnrollIds);
        }

        // Send notifications for newly enrolled courses
        if (enrolledCourses.length > 0) {
            const user = await auth.getUser(uid);
            const courseListHtml = enrolledCourses.map(c => `<li>${c.title}</li>`).join('');
            
            // Notify student
            if(user.email) {
                await sendEmail({
                    to: user.email,
                    subject: 'You have been enrolled in new courses!',
                    html: `<h1>Hi ${user.displayName},</h1><p>You have been enrolled in the following courses:</p><ul>${courseListHtml}</ul><p>Happy learning!</p>`,
                });
            }

            // Notify admins
            const adminUsers = await getAdminUserIds();
            const adminEmails = (await Promise.all(adminUsers.map(id => auth.getUser(id)))).map(u => u.email).filter(e => e);
            for (const adminEmail of adminEmails) {
                await sendEmail({
                    to: adminEmail,
                    subject: 'Course Enrollment',
                    html: `<p>The user ${user.displayName} (${user.email}) has been enrolled in ${enrolledCourses.length} course(s):</p><ul>${courseListHtml}</ul>`,
                });
            }
             for (const adminId of adminUsers) {
                await createNotification({
                    userId: adminId,
                    title: 'Course Enrollment',
                    message: `${user.displayName} was enrolled in ${enrolledCourses.length} course(s).`,
                    link: `/admin`,
                });
            }
        }
    }

    revalidatePath('/admin');
  } catch (error: any) {
    console.error("Failed to update user:", error);
    // Throw a new error to be caught by the client
    throw new Error(error.message || 'An unknown error occurred while updating the user.');
  }
}

/**
 * Fetches all courses and a specific user's progress using the Admin SDK.
 * This is a secure way to get the data needed for the ManageUserDialog.
 */
export async function getUserManagementData(userId: string): Promise<{ allCourses: Course[], assignedCourseIds: string[] }> {
    const { db } = getAdminServices();

    // 1. Fetch all courses
    const coursesSnapshot = await db.collection('courses').get();
    const allCourses = coursesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Course;
    });

    // 2. Fetch the specified user's progress
    const progressSnapshot = await db.collection('progress').where('userId', '==', userId).get();
    const assignedCourseIds = progressSnapshot.docs.map(doc => doc.data().courseId as string);

    return { allCourses, assignedCourseIds };
}

export async function enrollInCourseAction(userId: string, courseId: string): Promise<{ success: boolean; message?: string }> {
    if (!userId || !courseId) {
        return { success: false, message: 'User ID and Course ID are required.' };
    }
    
    const { db, auth } = getAdminServices();
    
    try {
        // Check if the user is already enrolled
        const progressRef = db.collection('progress');
        const q = progressRef.where('userId', '==', userId).where('courseId', '==', courseId);
        const existingEnrollment = await q.get();

        if (!existingEnrollment.empty) {
            return { success: false, message: 'User is already enrolled in this course.' };
        }
        
        // Fetch course and user details for notifications
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const user = await auth.getUser(userId);

        if (!courseDoc.exists || !user) {
            return { success: false, message: 'Course or user not found.' };
        }
        const course = courseDoc.data() as Course;

        // Create a new progress document to enroll the user
        await progressRef.add({
            userId,
            courseId,
            progress: 0,
            completed: false,
            completedLessons: [],
            startedAt: new Date(),
        });
        
        // --- Send Notifications ---
        // To user
        if (user.email) {
            await sendEmail({
                to: user.email,
                subject: `You're enrolled in ${course.title}!`,
                html: `<h1>Hi ${user.displayName},</h1><p>You have successfully enrolled in the course: <strong>${course.title}</strong>.</p><p>Happy learning!</p>`,
            });
        }
        
        // To admins
        const adminUsers = await getAdminUserIds();
        const adminEmails = (await Promise.all(adminUsers.map(id => auth.getUser(id)))).map(u => u.email).filter(e => e);

        for (const adminEmail of adminEmails) {
             await sendEmail({
                to: adminEmail,
                subject: 'New Course Enrollment',
                html: `<p>The user ${user.displayName} (${user.email}) has enrolled in the course: <strong>${course.title}</strong>.</p>`,
            });
        }
         for (const adminId of adminUsers) {
            await createNotification({
                userId: adminId,
                title: 'New Enrollment',
                message: `${user.displayName} has enrolled in ${course.title}.`,
                link: `/courses/${courseId}`,
            });
        }


        revalidatePath('/courses');
        revalidatePath('/student/dashboard');

        return { success: true };
    } catch (error: any) {
        console.error('Enrollment error:', error);
        return { success: false, message: 'Failed to enroll in the course.' };
    }
}
    

    