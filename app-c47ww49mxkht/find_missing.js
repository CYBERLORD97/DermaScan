const fs = require('fs');

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // very basic regex to extract keys, assuming format is simple
  const keys = [];
  
  // This is a bit fragile, let's just use typescript to require it.
}
