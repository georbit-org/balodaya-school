import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('src/content');
const publicDir = path.resolve('public');

let hasError = false;

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.ts'));

for (const file of files) {
  const content = fs.readFileSync(path.join(contentDir, file), 'utf8');
  const matches = content.matchAll(/'(\/assets\/[^']+)'/g);
  for (const match of matches) {
    const assetRelPath = match[1];
    const fullPath = path.join(publicDir, assetRelPath.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      console.error(`Missing asset in ${file}: ${assetRelPath} -> ${fullPath}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('Some asset paths are missing!');
  process.exit(1);
} else {
  console.log('All asset paths exist');
}
