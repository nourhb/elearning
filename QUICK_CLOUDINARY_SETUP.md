# Quick Cloudinary Setup Guide

## Step 1: Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

## Step 2: Get Your Cloud Name
1. After logging in, you'll see your **Cloud Name** in the dashboard
2. It looks like: `dx1234567` or `my-cloud-name`

## Step 3: Create an Upload Preset
1. Go to **Settings** → **Upload** tab
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set **Preset name** to something like `eduverse_uploads`
5. Set **Signing Mode** to **Unsigned**
6. Set **Folder** to `eduverse` (optional)
7. Click **Save**

## Step 4: Configure Environment Variables
1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add these lines:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name_here
```

## Step 5: Restart Your Development Server
```bash
npm run dev
```

## Troubleshooting

### Error: "Cloudinary not configured"
- Make sure your `.env.local` file exists
- Check that the environment variable names are exactly as shown
- Restart your development server after adding the variables

### Error: "Upload failed with status: 401"
- Verify your upload preset name is correct
- Make sure the upload preset is set to **Unsigned**
- Check that your cloud name is correct

### Error: "Upload failed with status: 400"
- Check that your upload preset allows the file types you're trying to upload
- Make sure the preset is active

## Testing Your Setup
1. Go to the community feed page
2. Try creating a post with an image
3. The image should upload successfully to Cloudinary

## Fallback Functionality
If Cloudinary is not configured, the app will use local file URLs as a fallback. This ensures the app continues to work even without Cloudinary setup.

## Need Help?
- Check the Cloudinary documentation: [docs.cloudinary.com](https://docs.cloudinary.com)
- Review the `env-example.txt` file in your project
- Make sure all environment variables are properly set
