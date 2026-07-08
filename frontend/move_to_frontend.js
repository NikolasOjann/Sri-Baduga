const fs = require('fs');
const path = require('path');

const root = __dirname;
const frontend = path.join(root, 'frontend');

if (!fs.existsSync(frontend)) {
  fs.mkdirSync(frontend);
}

const itemsToMove = [
  'src',
  'index.html',
  'vite.config.js',
  'package.json',
  'package-lock.json',
  'node_modules'
];

for (const item of itemsToMove) {
  const source = path.join(root, item);
  const dest = path.join(frontend, item);
  if (fs.existsSync(source)) {
    try {
      fs.renameSync(source, dest);
      console.log(`Moved ${item} to frontend/`);
    } catch (err) {
      console.error(`Failed to move ${item}:`, err);
    }
  } else {
    console.log(`${item} does not exist.`);
  }
}
