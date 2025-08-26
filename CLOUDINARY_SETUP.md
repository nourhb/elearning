# Cloudinary Setup Guide

## Overview
This application uses Cloudinary for image and file uploads for course images, user avatars, and formateur avatars. Follow these steps to configure Cloudinary:

## Step 1: Create a Cloudinary Account
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

## Step 2: Get Your Credentials
1. Log into your Cloudinary Dashboard
2. Copy your **Cloud Name** from the dashboard
3. Copy your **API Key** from the dashboard
4. Copy your **API Secret** from the dashboard

## Step 3: Create Upload Presets
1. In your Cloudinary Dashboard, go to **Settings** > **Upload**
2. Scroll down to **Upload presets**
3. Click **"Add upload preset"**
4. Set **Signing Mode** to **"Unsigned"**
5. Set **Folder** to **"course-images"** (for the first preset)
6. Click **Save**
7. Copy the preset name (it will appear in the list)
8. Repeat for additional folders:
   - **user-avatars** (for user profile pictures)
   - **formateur-avatars** (for formateur profile pictures)
   - **community-posts** (for community content)

## Step 4: Configure Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset-name
```

Replace the values with your actual credentials:
- `your-cloud-name`: Your Cloudinary cloud name
- `your-api-key`: Your Cloudinary API key
- `your-api-secret`: Your Cloudinary API secret
- `your-upload-preset-name`: The upload preset name you created

## Step 5: Restart the Development Server
After adding the environment variables, restart your development server:

```bash
npm run dev
```

## Features
- **Course Images**: Optimized for 800x600 with 80% quality
- **User Avatars**: Optimized for 200x200 with face detection and 85% quality
- **Formateur Avatars**: Optimized for 300x300 with face detection and 85% quality
- **Community Posts**: General purpose uploads
- **Automatic Optimization**: Cloudinary automatically optimizes images for web
- **Responsive Images**: Images are served with appropriate sizes for different devices
- **Secure URLs**: All uploads use HTTPS secure URLs
- **Face Detection**: Avatars use face detection for better cropping

## Upload Types and Optimizations

### Course Images
- **Size**: 800x600 pixels
- **Quality**: 80%
- **Crop**: Fill
- **Format**: Auto (WebP when supported)

### User Avatars
- **Size**: 200x200 pixels
- **Quality**: 85%
- **Crop**: Fill with face detection
- **Format**: Auto

### Formateur Avatars
- **Size**: 300x300 pixels
- **Quality**: 85%
- **Crop**: Fill with face detection
- **Format**: Auto

## Troubleshooting
- **Upload Failed**: Check that your upload preset is set to "Unsigned"
- **Environment Variables Not Working**: Make sure to restart the development server
- **File Size Too Large**: Cloudinary free tier has limits (10MB for images, 100MB for videos)
- **CORS Issues**: Make sure your upload preset allows the necessary origins
- **Face Detection Not Working**: Ensure you're using the correct avatar upload functions

## Security Notes
- The API Secret is only used server-side (not exposed to the browser)
- Upload presets should be set to "Unsigned" for client-side uploads
- Consider setting up folder restrictions in your upload preset for better organization
- Face detection is used for avatars to ensure better image cropping

## Migration from Firebase Storage
If you're migrating from Firebase Storage to Cloudinary:
1. Update your environment variables
2. Replace `ImageUpload` components with `CloudinaryImageUpload`
3. Use `AvatarUpload` for profile pictures
4. Update any hardcoded image URLs to use Cloudinary URLs
