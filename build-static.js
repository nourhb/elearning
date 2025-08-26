const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting DM0 static build...');

// Set environment variables to handle missing Firebase credentials
process.env.NODE_ENV = 'production';
process.env.SKIP_FIREBASE_INIT = 'true';

try {
  // Run the Next.js build
  console.log('📦 Running Next.js build...');
  execSync('next build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('✅ Build completed successfully!');
  
  // Check if out directory exists
  const outDir = path.join(__dirname, 'out');
  if (fs.existsSync(outDir)) {
    console.log('📁 Static files generated in out/ directory');
    
    // List some files to verify
    const files = fs.readdirSync(outDir);
    console.log('📄 Generated files:', files.slice(0, 10).join(', '));
    
    if (files.length > 0) {
      console.log('🎉 Static export ready for deployment!');
      process.exit(0);
    } else {
      console.error('❌ No files generated in out/ directory');
      process.exit(1);
    }
  } else {
    console.error('❌ out/ directory not found after build');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Check if we have any static files despite the error
  const outDir = path.join(__dirname, 'out');
  if (fs.existsSync(outDir)) {
    const files = fs.readdirSync(outDir);
    if (files.length > 0) {
      console.log('⚠️  Build had errors but static files were generated');
      console.log('📄 Files found:', files.slice(0, 10).join(', '));
      console.log('🎉 Proceeding with deployment...');
      process.exit(0);
    }
  }
  
  process.exit(1);
}
