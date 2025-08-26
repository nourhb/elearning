const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using port:', PORT);

// Check if out directory exists
const outDir = path.join(__dirname, 'out');
console.log('Checking out directory:', outDir);

if (!fs.existsSync(outDir)) {
  console.error('ERROR: out directory does not exist!');
  console.error('Current directory:', __dirname);
  console.error('Available files:', fs.readdirSync(__dirname));
  process.exit(1);
}

console.log('out directory exists, serving static files...');

// Serve static files from the out directory
app.use(express.static(outDir));

// Handle client-side routing by serving index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(outDir, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: index.html does not exist!');
    res.status(404).send('index.html not found');
    return;
  }
  
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
});
