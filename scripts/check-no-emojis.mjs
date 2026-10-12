import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Regex detecting emojis across common blocks
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

const targetDirs = [
  path.join(rootDir, 'src'),
];

let totalViolations = 0;
const violations = [];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const matches = line.match(emojiRegex);
        if (matches) {
          totalViolations += matches.length;
          violations.push({
            file: path.relative(rootDir, fullPath),
            line: idx + 1,
            emojis: matches.join(' '),
            preview: line.trim().slice(0, 100),
          });
        }
      });
    }
  }
}

for (const dir of targetDirs) {
  scan(dir);
}

if (violations.length > 0) {
  console.error(`\x1b[31m[EMOJI AUDIT FAILED]\x1b[0m Found ${violations.length} lines with emojis (${totalViolations} emoji instances):`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} [${v.emojis}] -> ${v.preview}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m[EMOJI AUDIT PASSED]\x1b[0m Zero emojis found in src/.`);
  process.exit(0);
}
