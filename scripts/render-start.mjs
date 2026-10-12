import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables if .env.local exists locally
try {
  process.loadEnvFile(path.join(rootDir, '.env.local'));
} catch {
  // Rely on process.env in production
}

const dbUrl = process.env.DATABASE_URL || 'file:data/balodaya.db';

console.log('[RENDER START] Bootstrapping Balodaya School runtime...');
console.log(`[RENDER START] Database URL: ${dbUrl}`);

// Ensure required upload and backup directories exist
const uploadDir = path.join(rootDir, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (dbUrl.startsWith('file:')) {
  let dbFilePath = dbUrl.replace(/^file:/, '');
  if (!path.isAbsolute(dbFilePath)) {
    dbFilePath = path.resolve(rootDir, dbFilePath);
  }

  const dbDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const backupDir = path.join(dbDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const dbExists = fs.existsSync(dbFilePath) && fs.statSync(dbFilePath).size > 0;

  if (!dbExists) {
    console.log(`[RENDER START] Database file not found at ${dbFilePath}. Running schema initialization and initial seed...`);
    try {
      execSync('node scripts/seed.mjs', { cwd: rootDir, stdio: 'inherit' });
      execSync('node scripts/import-existing-media.mjs', { cwd: rootDir, stdio: 'inherit' });
      console.log('[RENDER START] Database successfully seeded with baseline institutional data and CMS.');
    } catch (err) {
      console.error('[RENDER START] Error during initial database seed:', err);
      process.exit(1);
    }
  } else {
    console.log(`[RENDER START] Persistent database found at ${dbFilePath} (${fs.statSync(dbFilePath).size} bytes). Preserving state.`);
  }
} else {
  console.log('[RENDER START] Remote database connection specified. Continuing with server startup.');
}

console.log('[RENDER START] Environment initialization complete. Starting Next.js HTTP server...');
