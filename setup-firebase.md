# Firebase Admin SDK Setup Guide

## Quick Setup

To fix the "Failed to retrieve courses" and "Server configuration error" issues, you need to set up Firebase Admin SDK credentials.

### Option 1: Service Account JSON File (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (eduverse-98jdv)
3. Go to **Project Settings** (gear icon)
4. Click on **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Rename it to `service-account.json`
8. Place it in the project root (same level as `package.json`)

### Option 2: Environment Variables

1. Create a `.env.local` file in the project root
2. Add the following variables:

```env
FIREBASE_CLIENT_EMAIL=your-service-account-email@eduverse-98jdv.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_PROJECT_ID=eduverse-98jdv
```

### After Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Log in as admin
3. Go to admin dashboard
4. Click "Seed Database" to create sample courses
5. Try creating a student again

## Troubleshooting

- **"Service account not found"**: Make sure the JSON file is named exactly `service-account.json`
- **"Invalid private key"**: Make sure the private key includes the full PEM format with headers
- **"Project ID mismatch"**: Verify the project ID matches your Firebase project

## Security Note

- Never commit `service-account.json` or `.env.local` to version control
- These files contain sensitive credentials
- The `.gitignore` file should already exclude these files
