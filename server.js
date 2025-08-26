const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using port:', PORT);

// Serve static files from the out directory
app.use(express.static(path.join(__dirname, 'out')));

// Handle client-side routing by serving index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
