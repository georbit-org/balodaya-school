import fs from 'node:fs';
import path from 'node:path';
import { query } from '@/server/db';
import { audit } from '@/server/audit';
import { HttpError } from '@/server/http';

const BACKUP_DIR = path.resolve(process.cwd(), 'data', 'backups');
const DB_PATH = path.resolve(process.cwd(), 'data', 'balodaya.db');

export interface BackupFileInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function listBackups(): Promise<BackupFileInfo[]> {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR);
  const backups: BackupFileInfo[] = [];

  for (const f of files) {
    if (f.endsWith('.db')) {
      const fullPath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fullPath);
      backups.push({
        filename: f,
        sizeBytes: stat.size,
        createdAt: stat.mtime.toISOString(),
      });
    }
  }

  // Sort newest first
  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createBackup(userId: number): Promise<BackupFileInfo> {
  ensureBackupDir();
  if (!fs.existsSync(DB_PATH)) {
    throw new HttpError(404, 'Source database file data/balodaya.db not found');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
  const filename = `balodaya_backup_${timestamp}.db`;
  const destPath = path.join(BACKUP_DIR, filename);

  fs.copyFileSync(DB_PATH, destPath);

  const stat = fs.statSync(destPath);
  const info: BackupFileInfo = {
    filename,
    sizeBytes: stat.size,
    createdAt: stat.mtime.toISOString(),
  };

  await audit(userId, 'create_backup', 'system_backup', null, {
    filename,
    sizeBytes: stat.size,
  });

  return info;
}

export async function restoreBackup(filename: string, confirmationPhrase: string, userId: number): Promise<void> {
  if (confirmationPhrase !== 'RESTORE-BALODAYA-DATABASE') {
    throw new HttpError(400, 'Confirmation phrase must match "RESTORE-BALODAYA-DATABASE" exactly.');
  }

  const cleanFilename = path.basename(filename);
  const sourceBackup = path.join(BACKUP_DIR, cleanFilename);

  if (!fs.existsSync(sourceBackup)) {
    throw new HttpError(404, `Backup file ${cleanFilename} not found in backup vault`);
  }

  // Overwrite database
  fs.copyFileSync(sourceBackup, DB_PATH);

  await audit(userId, 'restore_backup', 'system_backup', null, {
    restoredFile: cleanFilename,
  });
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

export async function exportModule(module: string, format: 'json' | 'csv'): Promise<{ content: string; filename: string; contentType: string }> {
  let rows: Array<Record<string, unknown>> = [];
  const dateStr = new Date().toISOString().slice(0, 10);

  if (module === 'students') {
    rows = await query(`
      SELECT s.id, s.admission_no, e.roll_no, s.full_name, s.gender, s.dob,
             c.name as class_name, sec.name as section_name, s.status
      FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      GROUP BY s.id
      ORDER BY c.sort_order, sec.name, e.roll_no
    `);
  } else if (module === 'staff') {
    rows = await query(`
      SELECT id, name, email, role, phone, designation, active, created_at
      FROM users
      ORDER BY role, name
    `);
  } else if (module === 'fees') {
    rows = await query(`
      SELECT p.id as payment_id, p.receipt_no, p.amount, p.method, p.paid_on,
             s.full_name as student_name, s.admission_no, i.invoice_no, i.title as invoice_title
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN students s ON i.student_id = s.id
      ORDER BY p.id DESC
      LIMIT 1000
    `);
  } else if (module === 'attendance') {
    rows = await query(`
      SELECT a.id, a.date, a.status, s.full_name as student_name, e.roll_no,
             c.name as class_name, sec.name as section_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN enrollments e ON e.student_id = s.id
      JOIN sections sec ON e.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      ORDER BY a.date DESC, e.roll_no ASC
      LIMIT 1000
    `);
  } else {
    throw new HttpError(400, `Unknown export module "${module}"`);
  }

  if (format === 'csv') {
    return {
      content: toCsv(rows),
      filename: `balodaya_${module}_${dateStr}.csv`,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  return {
    content: JSON.stringify(rows, null, 2),
    filename: `balodaya_${module}_${dateStr}.json`,
    contentType: 'application/json; charset=utf-8',
  };
}
