#!/bin/bash

# Production Build Script for Learning Management System
# This script prepares the application for deployment on Hostinger

echo "🚀 Starting Production Build Process..."

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build the application
echo "🏗️ Building application..."
npm run build:production

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp next.config.js deployment/
cp .env.production deployment/.env

# Create deployment info
echo "📋 Creating deployment info..."
cat > deployment/DEPLOYMENT_INFO.txt << EOF
Learning Management System - Production Build
Build Date: $(date)
Node Version: $(node --version)
NPM Version: $(npm --version)
Build Status: SUCCESS

Deployment Instructions:
1. Upload the contents of this folder to your hosting directory
2. Set environment variables in your hosting panel
3. Configure Node.js to run: npm start
4. Set Node.js version to 18.x or higher

Environment Variables Required:
- All variables from .env.production file
- Firebase configuration
- Admin SDK credentials

For detailed instructions, see DEPLOYMENT.md
EOF

echo "✅ Production build completed successfully!"
echo "📁 Deployment package created in: ./deployment/"
echo "📋 See DEPLOYMENT_INFO.txt for deployment instructions"
echo "📖 See DEPLOYMENT.md for detailed hosting guide"

# Optional: Create a zip file for easy upload
if command -v zip &> /dev/null; then
    echo "📦 Creating deployment zip file..."
    cd deployment
    zip -r ../lms-production-$(date +%Y%m%d-%H%M%S).zip .
    cd ..
    echo "✅ Zip file created: lms-production-$(date +%Y%m%d-%H%M%S).zip"
fi

echo "🎉 Build process completed! Ready for deployment."
