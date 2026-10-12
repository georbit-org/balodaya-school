import { query, one } from '@/server/db';
import { listBackups } from '@/server/backup';

export interface DiagnosticIssue {
  id: string;
  category: 'Academics' | 'Timetable' | 'CMS' | 'Finance' | 'System';
  severity: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  fixUrl: string;
  fixActionLabel: string;
}

export async function checkSystemHealth(): Promise<{
  healthy: boolean;
  score: number;
  issues: DiagnosticIssue[];
  stats: {
    totalStudents: number;
    totalStaff: number;
    activePages: number;
    backupsCount: number;
  };
}> {
  const issues: DiagnosticIssue[] = [];

  // 1. Classes / Sections without class teacher
  const sectionsWithoutTeacher = await query<{ class_name: string; section_name: string }>(`
    SELECT c.name as class_name, sec.name as section_name
    FROM sections sec
    JOIN classes c ON sec.class_id = c.id
    WHERE sec.class_teacher_id IS NULL
  `);

  if (sectionsWithoutTeacher.length > 0) {
    issues.push({
      id: 'section_no_teacher',
      category: 'Academics',
      severity: 'warning',
      title: `${sectionsWithoutTeacher.length} section(s) have no designated Class Teacher`,
      description: `Sections: ${sectionsWithoutTeacher.map((s) => `${s.class_name} (${s.section_name})`).join(', ')}. Class teachers are required to review student leave and mark class attendance.`,
      fixUrl: '/app/settings/classes',
      fixActionLabel: 'Assign Class Teachers',
    });
  }

  // 2. Sections without timetable
  const sectionsWithoutTimetable = await query<{ class_name: string; section_name: string }>(`
    SELECT c.name as class_name, sec.name as section_name
    FROM sections sec
    JOIN classes c ON sec.class_id = c.id
    LEFT JOIN timetable_slots ts ON ts.section_id = sec.id
    WHERE ts.id IS NULL
    GROUP BY sec.id
  `);

  if (sectionsWithoutTimetable.length > 0) {
    issues.push({
      id: 'section_no_timetable',
      category: 'Timetable',
      severity: 'info',
      title: `${sectionsWithoutTimetable.length} section(s) have empty timetables`,
      description: `Students in ${sectionsWithoutTimetable.map((s) => `${s.class_name}-${s.section_name}`).join(', ')} cannot see scheduled periods on their dashboard.`,
      fixUrl: '/app/timetable',
      fixActionLabel: 'Create Timetable Slots',
    });
  }

  // 3. Teachers with no assigned subject
  const teachersWithNoSubject = await query<{ name: string }>(`
    SELECT u.name
    FROM users u
    WHERE u.role = 'teacher' AND u.active = 1
      AND u.id NOT IN (SELECT DISTINCT teacher_id FROM class_subjects WHERE teacher_id IS NOT NULL)
      AND u.id NOT IN (SELECT DISTINCT teacher_id FROM timetable_slots WHERE teacher_id IS NOT NULL)
  `);

  if (teachersWithNoSubject.length > 0) {
    issues.push({
      id: 'teacher_no_subject',
      category: 'Academics',
      severity: 'info',
      title: `${teachersWithNoSubject.length} active teacher(s) have no assigned subject`,
      description: `Teachers: ${teachersWithNoSubject.map((t) => t.name).join(', ')}.`,
      fixUrl: '/app/settings/subjects',
      fixActionLabel: 'Assign Subject Roles',
    });
  }

  // 4. Media missing alt text
  const mediaMissingAlt = await query<{ id: number; original_name: string }>(`
    SELECT id, original_name
    FROM media
    WHERE deleted_at IS NULL AND (alt_text IS NULL OR TRIM(alt_text) = '')
  `);

  if (mediaMissingAlt.length > 0) {
    issues.push({
      id: 'media_no_alt',
      category: 'CMS',
      severity: 'error',
      title: `${mediaMissingAlt.length} image(s) in Media Library missing alt text (WCAG AA)`,
      description: `Accessible screen readers require descriptive alt text for every public asset.`,
      fixUrl: '/app/media',
      fixActionLabel: 'Review Media Alt Text',
    });
  }

  // 5. CMS pages missing Nepali translation
  const pagesMissingNe = await query<{ title: string; slug: string }>(`
    SELECT title, slug
    FROM cms_pages
    WHERE status != 'archived' AND (title_ne IS NULL OR TRIM(title_ne) = '')
  `);

  if (pagesMissingNe.length > 0) {
    issues.push({
      id: 'pages_missing_ne',
      category: 'CMS',
      severity: 'info',
      title: `${pagesMissingNe.length} public page(s) lack Nepali titles`,
      description: `Pages: ${pagesMissingNe.map((p) => p.title).join(', ')}. Provide Nepali localized titles for full bilingual coverage.`,
      fixUrl: '/app/site/pages',
      fixActionLabel: 'Translate Pages',
    });
  }

  // 6. Unused fee heads
  const unusedFeeHeads = await query<{ name: string }>(`
    SELECT fh.name
    FROM fee_heads fh
    LEFT JOIN fee_structure fs ON fs.fee_head_id = fh.id
    WHERE fs.id IS NULL
  `);

  if (unusedFeeHeads.length > 0) {
    issues.push({
      id: 'unused_fee_heads',
      category: 'Finance',
      severity: 'info',
      title: `${unusedFeeHeads.length} fee category(ies) not assigned in any class fee structure`,
      description: `Categories: ${unusedFeeHeads.map((f) => f.name).join(', ')}.`,
      fixUrl: '/app/fees/structure',
      fixActionLabel: 'Configure Fee Structure',
    });
  }

  // 7. Backup recency
  const backups = await listBackups();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const hasRecentBackup = backups.some((b) => b.createdAt >= sevenDaysAgo);

  if (!hasRecentBackup) {
    issues.push({
      id: 'no_recent_backup',
      category: 'System',
      severity: 'warning',
      title: 'No database backup taken in the last 7 days',
      description: 'Regular backups protect school attendance, fee receipts, and marks from accidental loss.',
      fixUrl: '/app/settings/data',
      fixActionLabel: 'Take Instant Backup',
    });
  }

  // Basic stats
  const [studentsCount, staffCount, pagesCount] = await Promise.all([
    one<{ count: number }>("SELECT count(*) as count FROM students WHERE status = 'active'"),
    one<{ count: number }>("SELECT count(*) as count FROM users WHERE role IN ('teacher','principal','accountant')"),
    one<{ count: number }>("SELECT count(*) as count FROM cms_pages WHERE status = 'published'"),
  ]);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 10);

  return {
    healthy: errorCount === 0,
    score,
    issues,
    stats: {
      totalStudents: studentsCount?.count ?? 0,
      totalStaff: staffCount?.count ?? 0,
      activePages: pagesCount?.count ?? 0,
      backupsCount: backups.length,
    },
  };
}
