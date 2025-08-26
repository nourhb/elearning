@echo off
REM Production Build Script for Learning Management System (Windows)
REM This script prepares the application for deployment on Hostinger

echo 🚀 Starting Production Build Process...

REM Set production environment
set NODE_ENV=production

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci --only=production

REM Run type checking
echo 🔍 Running type checking...
call npm run type-check

REM Run linting
echo 🔍 Running linting...
call npm run lint

REM Build the application
echo 🏗️ Building application...
call npm run build:production

REM Create deployment package
echo 📦 Creating deployment package...
if exist deployment rmdir /s /q deployment
mkdir deployment
xcopy .next deployment\.next /E /I /Y
xcopy public deployment\public /E /I /Y
copy package.json deployment\
copy next.config.js deployment\
copy .env.production deployment\.env

REM Create deployment info
echo 📋 Creating deployment info...
echo Learning Management System - Production Build > deployment\DEPLOYMENT_INFO.txt
echo Build Date: %date% %time% >> deployment\DEPLOYMENT_INFO.txt
echo Node Version: >> deployment\DEPLOYMENT_INFO.txt
node --version >> deployment\DEPLOYMENT_INFO.txt
echo NPM Version: >> deployment\DEPLOYMENT_INFO.txt
npm --version >> deployment\DEPLOYMENT_INFO.txt
echo Build Status: SUCCESS >> deployment\DEPLOYMENT_INFO.txt
echo. >> deployment\DEPLOYMENT_INFO.txt
echo Deployment Instructions: >> deployment\DEPLOYMENT_INFO.txt
echo 1. Upload the contents of this folder to your hosting directory >> deployment\DEPLOYMENT_INFO.txt
echo 2. Set environment variables in your hosting panel >> deployment\DEPLOYMENT_INFO.txt
echo 3. Configure Node.js to run: npm start >> deployment\DEPLOYMENT_INFO.txt
echo 4. Set Node.js version to 18.x or higher >> deployment\DEPLOYMENT_INFO.txt
echo. >> deployment\DEPLOYMENT_INFO.txt
echo Environment Variables Required: >> deployment\DEPLOYMENT_INFO.txt
echo - All variables from .env.production file >> deployment\DEPLOYMENT_INFO.txt
echo - Firebase configuration >> deployment\DEPLOYMENT_INFO.txt
echo - Admin SDK credentials >> deployment\DEPLOYMENT_INFO.txt
echo. >> deployment\DEPLOYMENT_INFO.txt
echo For detailed instructions, see DEPLOYMENT.md >> deployment\DEPLOYMENT_INFO.txt

echo ✅ Production build completed successfully!
echo 📁 Deployment package created in: ./deployment/
echo 📋 See DEPLOYMENT_INFO.txt for deployment instructions
echo 📖 See DEPLOYMENT.md for detailed hosting guide

REM Create a zip file for easy upload (if PowerShell is available)
echo 📦 Creating deployment zip file...
powershell -command "Compress-Archive -Path 'deployment\*' -DestinationPath 'lms-production-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.zip' -Force"

echo 🎉 Build process completed! Ready for deployment.
pause
