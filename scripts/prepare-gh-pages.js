const fs = require('fs');
const path = require('path');

const browserDir = path.join(__dirname, '..', 'dist', 'service-day-dashboard', 'browser');
const indexPath = path.join(browserDir, 'index.html');
const notFoundPath = path.join(browserDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✓ Successfully created 404.html fallback in ' + browserDir);
} else {
  console.warn('⚠ index.html not found in ' + browserDir);
}
