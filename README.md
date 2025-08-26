# DM0 - E-Learning Platform

A modern e-learning platform built with Next.js, Firebase, and Tailwind CSS.

## 🚀 Deployment

### Render Deployment

This project is configured for deployment on Render. The build process will:

1. Install dependencies
2. Build the Next.js application
3. Generate static export for hosting

### Environment Variables

For the application to work properly, you need to set the following environment variables in your Render dashboard:

#### Firebase Configuration
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Firebase Admin SDK (for server-side operations)
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

#### Cloudinary (for image uploads)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Getting Firebase Credentials

1. Go to your Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Generate a new private key
4. Copy the `client_email` and `private_key` values
5. Set them as environment variables in Render

### Build Status

The application builds successfully with static export enabled. API routes are disabled for static hosting, but the UI and client-side functionality work properly.

## Features

- **Multi-role System**: Admin, Instructor (Formateur), and Student roles
- **Course Management**: Create, edit, and manage courses with modules and lessons
- **User Management**: Admin can create and manage users
- **Progress Tracking**: Track student progress through courses
- **Email Notifications**: Automated email notifications for various events
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Storage
3. Set up Firebase Admin SDK credentials

#### Firebase Admin SDK Setup

You need to set up Firebase Admin SDK credentials for server-side operations. Choose one of the following methods:

**Method 1: Service Account JSON File (Recommended)**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Place it in the project root as `service-account.json`

**Method 2: Environment Variables**
Create a `.env.local` file in the project root with:
```
FIREBASE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_PROJECT_ID=your-project-id
```

### Database Seeding

After setting up Firebase credentials, seed the database with sample courses:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Log in as an admin user
3. Go to the admin dashboard
4. Click "Seed Database" to create sample courses

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## User Roles

### Admin
- Create and manage users
- Approve courses
- View system statistics
- Seed database

### Instructor (Formateur)
- Create and manage courses
- Create students
- View course analytics

### Student
- Enroll in courses
- Track progress
- Complete lessons

## Troubleshooting

### "Failed to retrieve courses" Error
This error occurs when:
1. No courses exist in the database - Run the "Seed Database" action
2. Firebase admin credentials are not configured - Set up service account credentials
3. Firebase permissions are not set correctly - Check Firestore security rules

### "Server configuration error" Error
This indicates Firebase admin services are not properly configured. Check:
1. Service account JSON file exists and is valid
2. Environment variables are set correctly
3. Firebase project ID matches your configuration

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utilities and services
├── hooks/               # Custom React hooks
├── ai/                  # AI flows and schemas
└── types/               # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
