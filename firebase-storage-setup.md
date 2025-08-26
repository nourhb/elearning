# Firebase Storage Setup Guide

## 🔧 **Fix for Image Upload Issue**

The image upload is stuck because of Firebase Storage configuration issues. Follow these steps to fix it:

### **1. Update Firebase Storage Rules**

1. Go to your [Firebase Console](https://console.firebase.google.com/project/eduverse-98jdv)
2. Navigate to **Storage** in the left sidebar
3. Click on the **Rules** tab
4. Replace the existing rules with the content from `storage.rules`:

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

5. Click **Publish** to save the rules

### **2. Enable Firebase Storage (if not already enabled)**

1. In the Firebase Console, go to **Storage**
2. If you see a "Get Started" button, click it
3. Choose your storage location (preferably close to your users)
4. Start in **test mode** (we'll secure it with the rules above)

### **3. Verify Storage Bucket**

1. In the Firebase Console, go to **Storage**
2. Note the bucket name (should be `eduverse-98jdv.appspot.com`)
3. This should match the `storageBucket` in your `firebase.ts` file

### **4. Test the Upload**

1. Restart your development server: `npm run dev`
2. Try uploading an image again
3. Check the browser console for detailed error messages

## 🐛 **Common Issues & Solutions**

### **Issue: "storage/unauthorized"**
- **Solution**: Make sure you're logged in and the storage rules are published

### **Issue: "storage/quota-exceeded"**
- **Solution**: Use a smaller image file (under 5MB)

### **Issue: "storage/unauthenticated"**
- **Solution**: Make sure you're logged in to the app

### **Issue: Upload hangs forever**
- **Solution**: Check the browser console for network errors or CORS issues

## 📝 **Debugging**

The updated upload component now includes detailed console logging. Check your browser's developer console (F12) for:

- File details (name, size)
- Storage initialization status
- Upload progress
- Error codes and messages

## 🔄 **Next Steps**

After following these steps:

1. **Test the upload** with a small image file
2. **Check the console** for any error messages
3. **Verify the image appears** in your Firebase Storage console
4. **Confirm the image displays** in your course form

If you still have issues, please share the console error messages and I'll help you troubleshoot further!
