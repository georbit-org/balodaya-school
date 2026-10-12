import { query, one, run } from '@/server/db';
import { audit } from '@/server/audit';
import { HttpError } from '@/server/http';

export interface TemplateRecord {
  key: string;
  kind: 'sms' | 'receipt' | 'certificate' | 'marksheet' | 'email' | 'general';
  subject?: string | null;
  body_en: string;
  body_ne?: string | null;
  updated_by?: number | null;
  updated_at?: string;
}

export const DEFAULT_TEMPLATES: TemplateRecord[] = [
  {
    key: 'sms.attendance_absent',
    kind: 'sms',
    subject: 'Student Absent Notice',
    body_en: 'Dear Guardian, {student} of class {class} is marked absent on {date}. Please contact the school if unexpected.',
    body_ne: 'आदरणीय अभिभावक, कक्षा {class} का विद्यार्थी {student} मिति {date} मा अनुपस्थित हुनुभएको छ। कृपया विद्यालय प्रशासनमा सम्पर्क गर्नुहोला।',
  },
  {
    key: 'sms.fee_reminder',
    kind: 'sms',
    subject: 'Fee Due Reminder',
    body_en: 'Dear Guardian, a fee balance of NPR {amount} is pending for {student} ({class}). Kindly clear before {due_date}.',
    body_ne: 'आदरणीय अभिभावक, {student} ({class}) को शुल्क रु {amount} बाँकी रहेको छ। कृपया मिति {due_date} भित्र भुक्तानी गरिदिनुहोला।',
  },
  {
    key: 'sms.leave_approved',
    kind: 'sms',
    subject: 'Leave Approved',
    body_en: 'Leave application for {student} ({class}) from {from_date} to {to_date} has been approved.',
    body_ne: '{student} ({class}) को मिति {from_date} देखि {to_date} सम्मको बिदा स्वीकृत गरिएको छ।',
  },
  {
    key: 'receipt.footer',
    kind: 'receipt',
    subject: 'Official Receipt Note',
    body_en: 'Thank you for your payment. Please retain this receipt for official records. Fees once paid are non-refundable.',
    body_ne: 'शुल्क भुक्तानीका लागि धन्यवाद। यो रसिद सुरक्षित राख्नुहोला। भुक्तानी गरिएको शुल्क फिर्ता हुने छैन।',
  },
  {
    key: 'certificate.bonafide',
    kind: 'certificate',
    subject: 'Bonafide Certificate Text',
    body_en: 'This is to certify that {student}, son/daughter of {guardian}, is a bonafide student of Balodaya Secondary School studying in class {class} (Roll No: {roll}) for academic year {year}.',
    body_ne: 'प्रमाणित गरिन्छ कि {guardian} का छोरा/छोरी {student} यस बालोदय माध्यमिक विद्यालयमा शैक्षिक सत्र {year} मा कक्षा {class} (रोल नं: {roll}) मा अध्ययनरत नियमित विद्यार्थी हुन्।',
  },
  {
    key: 'certificate.character',
    kind: 'certificate',
    subject: 'Character Certificate Text',
    body_en: 'This is to certify that {student} was a student of class {class} in this institution. During the tenure at our school, conduct and moral character were found exemplary.',
    body_ne: 'प्रमाणित गरिन्छ कि {student} यस विद्यालयका कक्षा {class} का विद्यार्थी हुन्। विद्यालयमा अध्ययनरत रहँदा निजको चालचलन तथा नैतिक आचरण प्रशंसनीय रहेको पाइएको छ।',
  },
  {
    key: 'marksheet.remarks',
    kind: 'marksheet',
    subject: 'Standard Marksheet Evaluation Remarks',
    body_en: 'Promoted to the higher class with commendable performance. Keep striving for excellence.',
    body_ne: 'उत्कृष्ट नतिजासहित माथिल्लो कक्षामा उत्तीर्ण। उज्ज्वल भविष्यको शुभकामना।',
  },
  {
    key: 'welcome.email',
    kind: 'email',
    subject: 'Welcome to Balodaya School Portal',
    body_en: 'Namaste {name}, your official Balodaya portal account has been activated. Your username is {username}. Please sign in to access attendance, results, and fees.',
    body_ne: 'नमस्ते {name}, तपाईंको बालोदय विद्यालय पोर्टल खाता सक्रिय गरिएको छ। तपाईंको प्रयोगकर्ता नाम {username} हो। कृपया हाजिरी, नतिजा र शुल्क विवरणका लागि लगइन गर्नुहोस्।',
  },
];

export async function ensureDefaultTemplates(): Promise<void> {
  const existing = await one<{ count: number }>('SELECT count(*) as count FROM templates');
  if (existing && existing.count > 0) return;

  for (const t of DEFAULT_TEMPLATES) {
    await run(
      `INSERT OR IGNORE INTO templates (key, kind, subject, body_en, body_ne, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [t.key, t.kind, t.subject || null, t.body_en, t.body_ne || null]
    );
  }
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  await ensureDefaultTemplates();
  return query<TemplateRecord>(
    'SELECT key, kind, subject, body_en, body_ne, updated_by, updated_at FROM templates ORDER BY kind, key'
  );
}

export async function getTemplate(key: string): Promise<TemplateRecord | null> {
  await ensureDefaultTemplates();
  const row = await one<TemplateRecord>(
    'SELECT key, kind, subject, body_en, body_ne, updated_by, updated_at FROM templates WHERE key = ?',
    [key]
  );
  return row || null;
}

export async function updateTemplate(
  key: string,
  data: { kind?: string; subject?: string; body_en: string; body_ne?: string },
  userId: number
): Promise<TemplateRecord> {
  await ensureDefaultTemplates();
  if (!data.body_en || !data.body_en.trim()) {
    throw new HttpError(400, 'English body content is required for templates');
  }

  const existing = await getTemplate(key);
  if (!existing) {
    await run(
      `INSERT INTO templates (key, kind, subject, body_en, body_ne, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [key, data.kind || 'general', data.subject || null, data.body_en, data.body_ne || null, userId]
    );
  } else {
    await run(
      `UPDATE templates
       SET kind = COALESCE(?, kind),
           subject = ?,
           body_en = ?,
           body_ne = ?,
           updated_by = ?,
           updated_at = datetime('now')
       WHERE key = ?`,
      [data.kind || existing.kind, data.subject || null, data.body_en, data.body_ne || null, userId, key]
    );
  }

  await audit(userId, 'update', 'templates', key, {
    key,
    subject: data.subject,
    body_en_length: data.body_en.length,
  });

  const updated = await getTemplate(key);
  if (!updated) throw new HttpError(500, 'Failed to retrieve updated template');
  return updated;
}

export function renderTemplateText(templateText: string, vars: Record<string, string | number>): string {
  let result = templateText;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}
