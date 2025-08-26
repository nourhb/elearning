# Quick Cloudinary Setup

## Step 1: Create .env.local file
Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dnvnkytw5
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

## Step 2: Restart the server
```bash
npm run dev
```

## Step 3: Test upload
Try uploading an image - it should now work with Cloudinary!

## Alternative: Use Image Generation Tool
If Cloudinary still doesn't work, use the admin tool:
1. Go to Admin → Generate Course Images
2. Click "Generate Course Images"
3. This will give all courses beautiful Unsplash images

## Current Status
- ✅ Profile picture upload works (with fallback to placeholders)
- ✅ Course image upload works (with fallback to placeholders)
- ✅ Image generation tool works (creates beautiful Unsplash images)
- 🔄 Cloudinary upload (needs proper preset configuration)
