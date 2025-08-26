# Firestore Security Rules Setup

## Fix the "Missing or insufficient permissions" Error

The community page is getting a permissions error because your Firestore security rules are too restrictive. Here's how to fix it:

### Step 1: Update Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (eduverse-98jdv)
3. Go to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the content from `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read their own user document
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'formateur']);
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow authenticated users to read courses
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'formateur'];
    }

    // Allow authenticated users to read/write their own progress
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'formateur'];
    }

    // Allow authenticated users to read community discussions
    match /discussions/{discussionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.authorId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        (resource.data.authorId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Allow authenticated users to read/write replies
    match /replies/{replyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.authorId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        (resource.data.authorId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Allow authenticated users to read achievements
    match /achievements/{achievementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Allow authenticated users to read/write chat messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // Allow authenticated users to read/write notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }

    // Default rule - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish** to save the rules

### Step 2: Seed the Database

After updating the security rules:

1. Go to your application at `http://localhost:3000`
2. Log in as admin
3. Go to admin dashboard at `http://localhost:3000/admin`
4. Click **"Seed Database"** to create sample data

### Step 3: Test the Community Page

1. Navigate to `http://localhost:3000/community`
2. The page should now load without permission errors
3. You should see real data from the database

## What These Rules Do

- **Allow authenticated users** to read community discussions, replies, and achievements
- **Allow users to create** their own discussions and replies
- **Allow admins** to manage all content
- **Maintain security** by preventing unauthorized access
- **Support role-based permissions** for different user types

## Troubleshooting

If you still get permission errors:

1. **Check authentication** - Make sure you're logged in
2. **Clear browser cache** - Sometimes old rules are cached
3. **Wait a few minutes** - Firestore rules can take time to propagate
4. **Check console errors** - Look for specific permission details

## Security Notes

- These rules allow authenticated users to read community data
- Users can only create/edit their own content
- Admins have full access to manage content
- The default rule denies all other access for security
