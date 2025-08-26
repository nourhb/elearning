import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplate {
  subject: string;
  html: (data: any) => string;
  text?: (data: any) => string;
}

// Email templates
export const emailTemplates = {
  enrollmentRequest: {
    subject: 'New Enrollment Request - EduVerse',
    html: (data: { studentName: string; courseTitle: string; studentEmail: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Enrollment Request</h2>
        <p>A new student has requested to enroll in your course:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${data.studentName}</p>
          <p><strong>Email:</strong> ${data.studentEmail}</p>
          <p><strong>Course:</strong> ${data.courseTitle}</p>
        </div>
        <p>Please review and approve or deny this request in your admin dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/enrollment-requests" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review Request
        </a>
      </div>
    `
  },
  
  enrollmentApproved: {
    subject: 'Enrollment Approved - EduVerse',
    html: (data: { studentName: string; courseTitle: string; courseUrl: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Enrollment Approved!</h2>
        <p>Hello ${data.studentName},</p>
        <p>Great news! Your enrollment request for <strong>${data.courseTitle}</strong> has been approved.</p>
        <p>You can now start learning immediately!</p>
        <a href="${data.courseUrl}" 
           style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Start Learning
        </a>
      </div>
    `
  },
  
  enrollmentDenied: {
    subject: 'Enrollment Update - EduVerse',
    html: (data: { studentName: string; courseTitle: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Enrollment Update</h2>
        <p>Hello ${data.studentName},</p>
        <p>Your enrollment request for <strong>${data.courseTitle}</strong> has been reviewed.</p>
        <p>Unfortunately, your request was not approved at this time. Please contact support for more information.</p>
        <p>Thank you for your interest in our platform.</p>
      </div>
    `
  },
  
  welcomeEmail: {
    subject: 'Welcome to EduVerse!',
    html: (data: { userName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to EduVerse!</h2>
        <p>Hello ${data.userName},</p>
        <p>Welcome to EduVerse! We're excited to have you join our learning community.</p>
        <p>Here's what you can do to get started:</p>
        <ul>
          <li>Explore our course catalog</li>
          <li>Enroll in courses that interest you</li>
          <li>Connect with other learners</li>
          <li>Track your learning progress</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Explore Courses
        </a>
      </div>
    `
  }
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // If no SMTP credentials, use a test account (for development)
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('No SMTP credentials found. Using test account for development.');
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'testpass',
        },
      });
    } else {
      transporter = nodemailer.createTransport(emailConfig);
    }
  }
  return transporter;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailTransporter = getTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@eduverse.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send email using a template
 */
export async function sendTemplatedEmail(
  template: keyof typeof emailTemplates,
  to: string,
  data: any
): Promise<boolean> {
  const emailTemplate = emailTemplates[template];
  if (!emailTemplate) {
    console.error('Email template not found:', template);
    return false;
  }

  return sendEmail({
    to,
    subject: emailTemplate.subject,
    html: emailTemplate.html(data),
    text: emailTemplate.text?.(data),
  });
}

/**
 * Send enrollment request notification to admin
 */
export async function sendEnrollmentRequestEmail(
  adminEmail: string,
  studentName: string,
  studentEmail: string,
  courseTitle: string
): Promise<boolean> {
  return sendTemplatedEmail('enrollmentRequest', adminEmail, {
    studentName,
    studentEmail,
    courseTitle,
  });
}

/**
 * Send enrollment approval email to student
 */
export async function sendEnrollmentApprovedEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string,
  courseUrl: string
): Promise<boolean> {
  return sendTemplatedEmail('enrollmentApproved', studentEmail, {
    studentName,
    courseTitle,
    courseUrl,
  });
}

/**
 * Send enrollment denial email to student
 */
export async function sendEnrollmentDeniedEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string
): Promise<boolean> {
  return sendTemplatedEmail('enrollmentDenied', studentEmail, {
    studentName,
    courseTitle,
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<boolean> {
  return sendTemplatedEmail('welcomeEmail', userEmail, {
    userName,
  });
}
