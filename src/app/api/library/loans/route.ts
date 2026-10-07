import { readSession } from '@/server/session';
import { requireRole } from '@/server/guard';
import { query, run, one } from '@/server/db';
import { handle, json, HttpError } from '@/server/http';

export const GET = handle(async (req: Request) => {
  const session = await readSession();
  if (!session) throw new HttpError(401, 'Unauthorized');

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'active'; // 'active', 'overdue', 'returned', 'all'
  const q = url.searchParams.get('q')?.trim();

  let sql = `
    SELECT bl.id, bl.book_id, bl.student_id, bl.staff_id,
           bl.issued_on, bl.due_on, bl.returned_on,
           b.title as book_title, b.accession_no, b.author as book_author,
           s.full_name as student_name, s.admission_no,
           c.name as class_name, sec.name as section_name,
           u.name as staff_name,
           CASE
             WHEN bl.returned_on IS NOT NULL THEN 'returned'
             WHEN bl.due_on < date('now') THEN 'overdue'
             ELSE 'active'
           END as computed_status
    FROM book_loans bl
    JOIN books b ON bl.book_id = b.id
    LEFT JOIN students s ON bl.student_id = s.id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1)
    LEFT JOIN sections sec ON e.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    LEFT JOIN users u ON bl.staff_id = u.id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  // Role visibility
  if (session.role === 'student') {
    sql += ' AND bl.student_id = (SELECT id FROM students WHERE user_id = ?)';
    args.push(session.id);
  } else if (session.role === 'parent') {
    sql += ' AND bl.student_id IN (SELECT student_id FROM student_guardians WHERE user_id = ?)';
    args.push(session.id);
  }

  // Status filtering
  if (status === 'active') {
    sql += ' AND bl.returned_on IS NULL';
  } else if (status === 'overdue') {
    sql += " AND bl.returned_on IS NULL AND bl.due_on < date('now')";
  } else if (status === 'returned') {
    sql += ' AND bl.returned_on IS NOT NULL';
  }

  if (q) {
    sql += ' AND (b.title LIKE ? OR b.accession_no LIKE ? OR s.full_name LIKE ? OR u.name LIKE ?)';
    const term = `%${q}%`;
    args.push(term, term, term, term);
  }

  sql += ' ORDER BY bl.id DESC';

  const items = await query(sql, args);
  return json({ items });
});

export const POST = handle(async (req: Request) => {
  await requireRole('admin', 'principal', 'teacher');

  const body = await req.json().catch(() => ({}));
  const { book_id, borrower_type, borrower_id, issued_on, due_on } = body;

  const bookId = parseInt(book_id, 10);
  if (!bookId) throw new HttpError(400, 'Valid book is required.');

  if (!borrower_type || (borrower_type !== 'student' && borrower_type !== 'staff')) {
    throw new HttpError(400, 'Borrower type must be "student" or "staff".');
  }

  const borrowerId = parseInt(borrower_id, 10);
  if (!borrowerId) {
    throw new HttpError(400, `Valid ${borrower_type} selection is required.`);
  }

  const book = await one<{ id: number; title: string; copies: number }>(
    'SELECT id, title, copies FROM books WHERE id = ?',
    [bookId]
  );
  if (!book) throw new HttpError(404, 'Book not found.');

  // Check available copies
  const activeCount = await one<{ count: number }>(
    'SELECT COUNT(*) as count FROM book_loans WHERE book_id = ? AND returned_on IS NULL',
    [bookId]
  );
  const currentActive = activeCount?.count ?? 0;
  if (book.copies - currentActive <= 0) {
    throw new HttpError(400, 'No copies available for loan.');
  }

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const issueDate = issued_on || today;
  let dueDate = due_on;
  if (!dueDate) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    dueDate = d.toISOString().split('T')[0];
  }

  const studentId = borrower_type === 'student' ? borrowerId : null;
  const staffId = borrower_type === 'staff' ? borrowerId : null;

  const res = await run(
    `INSERT INTO book_loans (book_id, student_id, staff_id, issued_on, due_on)
     VALUES (?, ?, ?, ?, ?)`,
    [bookId, studentId, staffId, issueDate, dueDate]
  );

  return json({ id: Number(res.lastInsertRowid), book_id: bookId, issued_on: issueDate, due_on: dueDate }, 201);
});
