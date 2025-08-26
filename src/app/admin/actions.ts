
'use server';

import { getAdminServices } from '@/lib/firebase-admin';
import type { Course, UserProfile } from '@/lib/types';
import { seedDatabase } from '@/ai/flows/seed-database';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { deleteUser as deleteUserFlow } from '@/ai/flows/delete-user';
import { sendEmail } from '@/lib/services/email';
import { createNotification, getAdminUserIds } from '@/lib/services/notifications';
import { validateRoleAssignment, type UserRole } from '@/lib/permissions';
import { 
  notifyAdminsNewUser, 
  notifyAdminsUserUpdated, 
  notifyAdminsUserDeleted,
  notifyAdminsUserSuspended,
  notifyAdminsUserActivated,
  notifyAdminsNewEnrollmentRequest,
  notifyAdminsEnrollmentApproved,
  notifyAdminsEnrollmentDenied
} from '@/lib/services/admin-notifications';


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
  role: z.enum(['student', 'formateur', 'admin']),
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
  try {
    const { auth, db } = getAdminServices();
  } catch (error: any) {
    console.error("Firebase Admin services not available:", error);
    return { 
      message: 'Server configuration error. Please check Firebase admin credentials.',
      errors: { 
        system: 'Firebase admin services are not properly configured. Please contact your administrator.' 
      }
    };
  }
  
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
  
  // Get creator's role for permission validation
  let creatorRole: UserRole = 'student';
  try {
    const { auth } = getAdminServices();
    const creatorRecord = await auth.getUser(creatorId);
    creatorRole = (creatorRecord.customClaims?.role as UserRole) || 'student';
  } catch (error) {
    console.error('Failed to get creator role:', error);
    return { message: 'Failed to validate creator permissions.' };
  }

  // Validate role assignment using RBAC system
  const roleValidation = validateRoleAssignment(creatorRole, role);
  if (!roleValidation.valid) {
    return { 
      message: roleValidation.message || 'Invalid role assignment.',
      errors: { role: roleValidation.message }
    };
  }
  
  let newUserUid: string;
  
  try {
    const { auth, db } = getAdminServices();
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
            subject: 'New User Created',
            html: `
                <h2>New User Created</h2>
                <p><strong>Name:</strong> ${displayName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> ${role}</p>
                <p><strong>Created by:</strong> ${creatorRole === 'admin' ? 'Administrator' : 'Instructor'}</p>
                <p><strong>Created at:</strong> ${new Date().toLocaleDateString()}</p>
                <p><a href="/admin/users">View All Users</a></p>
            `,
        });
    }

    // --- Create In-App Notification for Admins ---
    const userData = {
      uid: newUserUid,
      displayName,
      email,
      role,
      status: 'active'
    };
    
    await notifyAdminsNewUser(userData, creatorId);


  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        return { message: 'This email is already in use.', errors: { email: 'Email already exists.' } };
    }
    console.error("Error creating user:", error);
    return { message: 'Failed to create user account.' };
  }
  
  try {
    const { auth, db } = getAdminServices();
    const assignedCourses = await assignCoursesToUser(newUserUid, courseIds);
    
    // --- Send Course Assignment Email ---
    if (assignedCourses.length > 0) {
        const courseList = assignedCourses.map(course => `<li>${course.title}</li>`).join('');
        await sendEmail({
            to: email,
            subject: 'Course Assignments',
            html: `<h1>Hi ${firstName},</h1><p>You have been assigned to the following courses:</p><ul>${courseList}</ul><p>You can now access these courses in your dashboard.</p>`,
        });
    }

    return { 
      message: `User ${displayName} created successfully with role: ${role}. ${assignedCourses.length > 0 ? `${assignedCourses.length} course(s) assigned.` : ''}`,
      success: true 
    };
  } catch (error: any) {
    console.error("Error assigning courses:", error);
    return { 
      message: `User created but failed to assign courses: ${error.message}`,
      success: true 
    };
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
    role: UserRole;
    status: 'active' | 'suspended';
    courseIds: string[];
    updaterId: string; // Add updater ID for permission validation
}

export async function updateUserAction(params: UpdateUserParams) {
  const { uid, role, status, courseIds, updaterId } = params;
  const { auth, db } = getAdminServices();

  if (!uid || !role || !status) {
    throw new Error('Missing required user information.');
  }

  // Get updater's role for permission validation
  let updaterRole: UserRole = 'student';
  try {
    const updaterRecord = await auth.getUser(updaterId);
    updaterRole = (updaterRecord.customClaims?.role as UserRole) || 'student';
  } catch (error) {
    console.error('Failed to get updater role:', error);
    throw new Error('Failed to validate updater permissions.');
  }

  // Get target user's current role
  let targetUserRole: UserRole = 'student';
  try {
    const targetUserRecord = await auth.getUser(uid);
    targetUserRole = (targetUserRecord.customClaims?.role as UserRole) || 'student';
  } catch (error) {
    console.error('Failed to get target user role:', error);
    throw new Error('Failed to get target user information.');
  }

  // Validate role assignment if role is being changed
  if (role !== targetUserRole) {
    const roleValidation = validateRoleAssignment(updaterRole, role);
    if (!roleValidation.valid) {
      throw new Error(roleValidation.message || 'Invalid role assignment.');
    }
  }

  try {
    // 1. Update Role (Auth Claim + Firestore)
    await auth.setCustomUserClaims(uid, { role });
    
    // 2. Update Status (Auth Disabled Flag + Firestore)
    const disabled = status === 'suspended';
    await auth.updateUser(uid, { disabled });

    // 3. Update User Document in Firestore
    await db.collection('users').doc(uid).update({ 
      role, 
      status,
      updatedAt: new Date(),
      updatedBy: updaterId
    });

    // 4. Update Course Assignments
    const progressRef = db.collection('progress');
    const q = progressRef.where('userId', '==', uid);
    
    const existingProgressSnap = await q.get();
    const existingProgress = existingProgressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const existingCourseIds = new Set(existingProgress.map(p => p.courseId));
    const newCourseIdsSet = new Set(courseIds);

    const coursesToUnenroll = existingProgress.filter(p => !newCourseIdsSet.has(p.courseId));
    const coursesToEnrollIds = courseIds.filter(id => !existingCourseIds.has(id));

    // Remove progress for unenrolled courses
    if (coursesToUnenroll.length > 0) {
        const batch = db.batch();
        coursesToUnenroll.forEach(progress => {
            batch.delete(progressRef.doc(progress.id));
        });
        await batch.commit();
    }

    // Add progress for newly enrolled courses
    if (coursesToEnrollIds.length > 0) {
        const batch = db.batch();
        for (const courseId of coursesToEnrollIds) {
            const progressDocRef = progressRef.doc();
            batch.set(progressDocRef, {
                userId: uid,
                courseId,
                progress: 0,
                completed: false,
                completedLessons: [],
                startedAt: new Date(),
            });
        }
        await batch.commit();
    }

    // 5. Send notification to user about role/status change
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.email) {
            const roleChangeMessage = role !== targetUserRole ? `Your role has been changed to ${role}.` : '';
            const statusChangeMessage = status === 'suspended' ? 'Your account has been suspended.' : 'Your account has been activated.';
            
            if (roleChangeMessage || statusChangeMessage) {
                await sendEmail({
                    to: userData.email,
                    subject: 'Account Update',
                    html: `<h1>Account Update</h1><p>${roleChangeMessage} ${statusChangeMessage}</p>`,
                });
            }
        }
    }

    // 6. Send admin notifications
    const userData = {
      uid,
      displayName: userDoc.data()?.displayName || 'Unknown User',
      email: userDoc.data()?.email || 'unknown@email.com',
      role,
      status
    };

    await notifyAdminsUserUpdated(userData, updaterId);

    // Send specific notifications for status changes
    if (status === 'suspended') {
      await notifyAdminsUserSuspended(userData, updaterId);
    } else if (status === 'active' && targetUserRole === 'suspended') {
      await notifyAdminsUserActivated(userData, updaterId);
    }

    return { success: true, message: 'User updated successfully.' };
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error.message}`);
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
        // Get user details to check role
        const user = await auth.getUser(userId);
        const userRole = user.customClaims?.role || 'student';
        
        // Prevent admin users from enrolling in courses
        if (userRole === 'admin') {
            return { success: false, message: 'Administrators cannot enroll in courses. Only students can enroll.' };
        }
        
        // Check if the user is already enrolled
        const progressRef = db.collection('progress');
        const q = progressRef.where('userId', '==', userId).where('courseId', '==', courseId);
        const existingEnrollment = await q.get();

        if (!existingEnrollment.empty) {
            return { success: false, message: 'User is already enrolled in this course.' };
        }
        
        // Check if there's already a pending request
        const requestsRef = db.collection('enrollmentRequests');
        const requestQuery = requestsRef.where('studentId', '==', userId)
                                     .where('courseId', '==', courseId)
                                     .where('status', '==', 'pending');
        const existingRequest = await requestQuery.get();

        if (!existingRequest.empty) {
            return { success: false, message: 'You already have a pending enrollment request for this course.' };
        }
        
        // Fetch course details
        const courseDoc = await db.collection('courses').doc(courseId).get();

        if (!courseDoc.exists) {
            return { success: false, message: 'Course not found.' };
        }
        const course = courseDoc.data() as Course;

        // Create enrollment request instead of direct enrollment
        const { createEnrollmentRequest } = await import('@/lib/services/enrollment-requests');
        
        await createEnrollmentRequest(
            db,
            userId,
            user.displayName || 'Unknown User',
            user.email || '',
            courseId,
            course.title,
            course.instructorId || 'unknown',
            undefined // Optional request message
        );

        revalidatePath('/courses');
        revalidatePath('/student/dashboard');

        return { success: true, message: 'Enrollment request submitted successfully. You will be notified when it is approved or denied.' };
    } catch (error: any) {
        console.error('Enrollment error:', error);
        return { success: false, message: 'Failed to enroll in the course.' };
    }
}
    
export async function changeUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const { auth } = getAdminServices();
    
    // Validate password strength
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    
    // Update user password
    await auth.updateUser(uid, { password: newPassword });
    
    // Send email notification to user about password change
    const userRecord = await auth.getUser(uid);
    if (userRecord.email) {
      await sendEmail({
        to: userRecord.email,
        subject: 'Your password has been changed',
        html: `
          <h1>Password Change Notification</h1>
          <p>Hello ${userRecord.displayName || 'there'},</p>
          <p>Your password has been changed by an administrator.</p>
          <p>If you did not request this change, please contact support immediately.</p>
          <p>Best regards,<br>The EduVerse Team</p>
        `,
      });
    }
    
    return { success: true, message: 'Password changed successfully.' };
  } catch (error: any) {
    console.error('Error changing user password:', error);
    return { success: false, message: error.message || 'Failed to change password.' };
  }
}
    

    