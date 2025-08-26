# 🔧 Firebase Storage Troubleshooting Guide

## 🚨 **Image Upload Stuck Issue - Complete Fix**

If your image upload is getting stuck in "Uploading..." state, follow these steps to fix it:

### **Step 1: Enable Firebase Storage**

1. **Go to Firebase Console**: https://console.firebase.google.com/project/eduverse-98jdv
2. **Navigate to Storage** in the left sidebar
3. **Click "Get Started"** if you see it
4. **Choose Storage Location**: Select a location close to your users (e.g., `us-central1`)
5. **Start in Test Mode**: Choose "Start in test mode" for now

### **Step 2: Update Storage Rules**

1. **In Firebase Console**, go to **Storage** → **Rules**
2. **Replace the existing rules** with this content:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read and write course images
    match /course-images/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read and write profile images
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default rule - deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Click "Publish"** to save the rules

### **Step 3: Verify Firebase Configuration**

Check that your `src/lib/firebase.ts` has the correct `storageBucket`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCaJaxzpsLe-d1D9b0v9rFSM1yZR68QsR0",
  authDomain: "eduverse-98jdv.firebaseapp.com",
  projectId: "eduverse-98jdv",
  storageBucket: "eduverse-98jdv.appspot.com", // ✅ This should be correct
  messagingSenderId: "1033061760650",
  appId: "1:1033061760650:web:192ad12f7649972151b773"
};
```

### **Step 4: Test the Upload**

1. **Open your browser's Developer Console** (F12)
2. **Try uploading an image** in your course creation form
3. **Check the console logs** for detailed information
4. **Look for any error messages** in the console

### **Step 5: Common Error Codes & Solutions**

#### **Error: `storage/unauthorized`**
- **Cause**: Storage rules are too restrictive
- **Solution**: Make sure you're logged in and the rules allow your user ID

#### **Error: `storage/bucket-not-found`**
- **Cause**: Firebase Storage not enabled
- **Solution**: Enable Firebase Storage in the console

#### **Error: `storage/quota-exceeded`**
- **Cause**: Storage quota exceeded
- **Solution**: Use a smaller image file (under 5MB)

#### **Error: `storage/unauthenticated`**
- **Cause**: User not logged in
- **Solution**: Make sure you're logged in to the app

#### **Error: `storage/object-not-found`**
- **Cause**: Storage bucket configuration issue
- **Solution**: Check your Firebase project configuration

### **Step 6: Debug Information**

The updated upload component now provides detailed console logging. When you try to upload, you should see:

```
=== Starting upload process ===
User ID: [your-user-id]
File details: { name: "image.jpg", size: 123456, type: "image/jpeg" }
Initializing Firebase Storage...
Storage initialized successfully
File path: course-images/[user-id]/[timestamp]-image.jpg
Creating storage reference...
Storage reference created
Starting file upload...
Upload task created, waiting for completion...
Upload completed successfully
Bytes transferred: 123456
Total bytes: 123456
Getting download URL...
Download URL obtained: https://...
=== Upload process completed successfully ===
```

### **Step 7: Manual Testing**

1. **Create a simple test**:
   ```javascript
   // In browser console, test if Firebase Storage is working
   const storage = firebase.storage();
   console.log('Storage bucket:', storage.app.options.storageBucket);
   ```

2. **Check authentication**:
   ```javascript
   // In browser console, check if user is authenticated
   firebase.auth().currentUser
   ```

### **Step 8: Alternative Solutions**

If the issue persists:

1. **Clear browser cache** and try again
2. **Try a different browser** to rule out browser-specific issues
3. **Check network connectivity** - ensure you can access Firebase services
4. **Verify Firebase project** - make sure you're using the correct project

### **Step 9: Emergency Fix**

If nothing works, you can temporarily disable image upload:

1. **Comment out the image upload component** in your course form
2. **Use a placeholder image** for now
3. **Focus on other features** while we debug the storage issue

### **Step 10: Get Help**

If you're still having issues:

1. **Share the console error messages** from your browser
2. **Check if Firebase Storage is enabled** in your project
3. **Verify your Firebase project settings**
4. **Try uploading a very small image** (under 1MB) first

## 🎯 **Expected Behavior After Fix**

Once everything is working correctly:

1. **Upload starts immediately** when you select a file
2. **Progress indicator** shows "Uploading..." with spinner
3. **Console logs** show detailed progress
4. **Success message** appears when upload completes
5. **Image preview** updates with the uploaded image
6. **No errors** in the browser console

## 🔍 **Verification Checklist**

- [ ] Firebase Storage is enabled in console
- [ ] Storage rules are published and correct
- [ ] Firebase configuration has correct `storageBucket`
- [ ] User is authenticated when uploading
- [ ] Image file is under 5MB
- [ ] Browser console shows no errors
- [ ] Upload completes successfully

**Try these steps and let me know what error messages you see in the browser console!** 🔧

