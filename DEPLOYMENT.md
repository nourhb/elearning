# Production Deployment Guide

## 🚀 Hosting on Hostinger

This guide will help you deploy your Learning Management System to Hostinger.

### Prerequisites

1. **Hostinger Account** with Node.js hosting plan
2. **Firebase Project** configured for production
3. **Domain Name** (optional but recommended)

### Step 1: Prepare Your Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication, Firestore, and Storage
4. Add your production domain to authorized domains
5. Download your Firebase Admin SDK service account key

### Step 2: Configure Environment Variables

1. Create `.env.production` file with your production values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_production_project_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour production private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your_production_client_email
FIREBASE_ADMIN_CLIENT_ID=your_production_client_id
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=your_production_cert_url

# App Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Learning Management System
NODE_ENV=production
```

### Step 3: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build:production
```

### Step 4: Deploy to Hostinger

#### Option A: Using Hostinger's Node.js Hosting

1. **Upload Files**:
   - Upload the entire project folder to your hosting directory
   - Make sure `.env.production` is included

2. **Configure Node.js**:
   - Set Node.js version to 18.x or higher
   - Set startup file to: `server.js` (if using standalone output)
   - Or set to: `npm start` (if using standard output)

3. **Set Environment Variables**:
   - Add all environment variables from `.env.production` to Hostinger's environment variables section

4. **Configure Domain**:
   - Point your domain to the hosting directory
   - Enable SSL certificate

#### Option B: Using Hostinger's VPS

1. **Connect to VPS** via SSH
2. **Install Node.js and npm**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Upload and Setup**:
   ```bash
   # Upload files to /var/www/your-app
   cd /var/www/your-app
   npm install
   npm run build:production
   ```

4. **Setup PM2** (Process Manager):
   ```bash
   npm install -g pm2
   pm2 start npm --name "lms-app" -- start:production
   pm2 startup
   pm2 save
   ```

5. **Configure Nginx** (if needed):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Step 5: Post-Deployment

1. **Test the Application**:
   - Visit your domain
   - Test user registration/login
   - Test course creation and enrollment
   - Test admin functions

2. **Monitor Performance**:
   - Check Hostinger's performance metrics
   - Monitor Firebase usage
   - Set up error tracking

3. **Security Checklist**:
   - ✅ SSL certificate enabled
   - ✅ Environment variables secured
   - ✅ Firebase security rules configured
   - ✅ Admin access restricted
   - ✅ Rate limiting enabled (if available)

### Troubleshooting

#### Common Issues:

1. **Build Errors**:
   ```bash
   npm run clean
   npm install
   npm run build:production
   ```

2. **Environment Variables**:
   - Ensure all variables are set in Hostinger
   - Check for typos in variable names
   - Verify Firebase configuration

3. **Database Connection**:
   - Verify Firebase project settings
   - Check Firestore rules
   - Ensure authentication is enabled

4. **Performance Issues**:
   - Enable caching in Hostinger
   - Optimize images
   - Use CDN for static assets

### Maintenance

1. **Regular Updates**:
   ```bash
   npm update
   npm run build:production
   ```

2. **Backup Strategy**:
   - Regular database backups
   - Code repository backups
   - Environment variable backups

3. **Monitoring**:
   - Set up uptime monitoring
   - Monitor error logs
   - Track user analytics

### Support

For issues specific to Hostinger:
- Contact Hostinger Support
- Check Hostinger's Node.js documentation
- Review hosting plan limitations

For application issues:
- Check Firebase Console logs
- Review application error logs
- Test in development environment first
