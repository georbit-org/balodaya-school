import { query, one, run } from '@/server/db';
import { audit } from '@/server/audit';
import { HttpError } from '@/server/http';

export interface LookupRecord {
  id: number;
  kind: string;
  code: string;
  label: string;
  label_ne: string | null;
  sort_order: number;
  active: number;
}

export interface CustomFieldRecord {
  id: number;
  entity: string;
  key: string;
  label: string;
  label_ne: string | null;
  type: string;
  options: string | null;
  required: number;
  visible_roles: string | null;
  sort_order: number;
  active: number;
}

const DEFAULT_LOOKUPS: Array<Omit<LookupRecord, 'id'>> = [
  // Blood Groups
  { kind: 'blood_group', code: 'A_POS', label: 'A Positive (A+)', label_ne: 'ए पोजिटिभ (A+)', sort_order: 1, active: 1 },
  { kind: 'blood_group', code: 'A_NEG', label: 'A Negative (A-)', label_ne: 'ए नेगेटिभ (A-)', sort_order: 2, active: 1 },
  { kind: 'blood_group', code: 'B_POS', label: 'B Positive (B+)', label_ne: 'बी पोजिटिभ (B+)', sort_order: 3, active: 1 },
  { kind: 'blood_group', code: 'B_NEG', label: 'B Negative (B-)', label_ne: 'बी नेगेटिभ (B-)', sort_order: 4, active: 1 },
  { kind: 'blood_group', code: 'AB_POS', label: 'AB Positive (AB+)', label_ne: 'एबी पोजिटिभ (AB+)', sort_order: 5, active: 1 },
  { kind: 'blood_group', code: 'AB_NEG', label: 'AB Negative (AB-)', label_ne: 'एबी नेगेटिभ (AB-)', sort_order: 6, active: 1 },
  { kind: 'blood_group', code: 'O_POS', label: 'O Positive (O+)', label_ne: 'ओ पोजिटिभ (O+)', sort_order: 7, active: 1 },
  { kind: 'blood_group', code: 'O_NEG', label: 'O Negative (O-)', label_ne: 'ओ नेगेटिभ (O-)', sort_order: 8, active: 1 },

  // Designations
  { kind: 'designation', code: 'PRINCIPAL', label: 'Principal / Headmaster', label_ne: 'प्रधानाध्यापक', sort_order: 1, active: 1 },
  { kind: 'designation', code: 'VICE_PRINCIPAL', label: 'Vice Principal', label_ne: 'सहायक प्रधानाध्यापक', sort_order: 2, active: 1 },
  { kind: 'designation', code: 'SEC_TEACHER', label: 'Secondary Level Teacher', label_ne: 'माध्यमिक तह शिक्षक', sort_order: 3, active: 1 },
  { kind: 'designation', code: 'BASIC_TEACHER', label: 'Basic Level Teacher', label_ne: 'आधारभूत तह शिक्षक', sort_order: 4, active: 1 },
  { kind: 'designation', code: 'ACCOUNTANT', label: 'Accountant / Bursar', label_ne: 'लेखापाल', sort_order: 5, active: 1 },
  { kind: 'designation', code: 'ADMIN_ASST', label: 'Administrative Assistant', label_ne: 'प्रशासनिक सहायक', sort_order: 6, active: 1 },
  { kind: 'designation', code: 'LIBRARIAN', label: 'Librarian', label_ne: 'पुस्तकालय प्रमुख', sort_order: 7, active: 1 },
  { kind: 'designation', code: 'LAB_ASST', label: 'Science / IT Lab Assistant', label_ne: 'प्रयोगशाला सहायक', sort_order: 8, active: 1 },

  // Payment Modes
  { kind: 'payment_mode', code: 'CASH', label: 'Cash at Counter', label_ne: 'नगद भुक्तानी', sort_order: 1, active: 1 },
  { kind: 'payment_mode', code: 'BANK', label: 'Bank Deposit / Transfer', label_ne: 'बैंक दाखिला', sort_order: 2, active: 1 },
  { kind: 'payment_mode', code: 'ESEWA', label: 'eSewa Digital Wallet', label_ne: 'ई-सेवा', sort_order: 3, active: 1 },
  { kind: 'payment_mode', code: 'KHALTI', label: 'Khalti Wallet', label_ne: 'खल्ती', sort_order: 4, active: 1 },
  { kind: 'payment_mode', code: 'CHEQUE', label: 'Account Payee Cheque', label_ne: 'चेक मार्फत', sort_order: 5, active: 1 },

  // Document Types
  { kind: 'document_type', code: 'BIRTH_CERT', label: 'Birth Registration Certificate', label_ne: 'जन्म दर्ता प्रमाणपत्र', sort_order: 1, active: 1 },
  { kind: 'document_type', code: 'TRANSFER_CERT', label: 'Transfer / Character Certificate', label_ne: 'चारित्रिक तथा स्थानान्तरण प्रमाणपत्र', sort_order: 2, active: 1 },
  { kind: 'document_type', code: 'CITIZENSHIP', label: 'Guardian Citizenship / ID', label_ne: 'अभिभावक नागरिकता प्रमाणपत्र', sort_order: 3, active: 1 },
  { kind: 'document_type', code: 'PREV_MARKSHEET', label: 'Previous School Marksheet', label_ne: 'अघिल्लो कक्षाको लब्धाङ्क पत्र', sort_order: 4, active: 1 },

  // Relationships
  { kind: 'relationship', code: 'FATHER', label: 'Father', label_ne: 'बुबा', sort_order: 1, active: 1 },
  { kind: 'relationship', code: 'MOTHER', label: 'Mother', label_ne: 'आमा', sort_order: 2, active: 1 },
  { kind: 'relationship', code: 'GUARDIAN', label: 'Legal Guardian', label_ne: 'कानूनी संरक्षक', sort_order: 3, active: 1 },
];

const DEFAULT_CUSTOM_FIELDS: Array<Omit<CustomFieldRecord, 'id'>> = [
  {
    entity: 'student',
    key: 'allergies_medical',
    label: 'Medical Conditions / Allergies',
    label_ne: 'स्वास्थ्य समस्या वा एलर्जी',
    type: 'text',
    options: null,
    required: 0,
    visible_roles: '["admin","principal","teacher"]',
    sort_order: 10,
    active: 1,
  },
  {
    entity: 'student',
    key: 'transport_stop',
    label: 'Designated Bus Stop',
    label_ne: 'बस चढ्ने स्थान',
    type: 'text',
    options: null,
    required: 0,
    visible_roles: '["admin","principal","accountant"]',
    sort_order: 20,
    active: 1,
  },
  {
    entity: 'staff',
    key: 'emergency_contact_phone',
    label: 'Emergency Contact Number',
    label_ne: 'आपतकालीन सम्पर्क नम्बर',
    type: 'text',
    options: null,
    required: 1,
    visible_roles: '["admin","principal"]',
    sort_order: 10,
    active: 1,
  },
  {
    entity: 'application',
    key: 'previous_school_name',
    label: 'Name of Previous School',
    label_ne: 'पहिले अध्ययन गरेको विद्यालयको नाम',
    type: 'text',
    options: null,
    required: 1,
    visible_roles: '["admin","principal"]',
    sort_order: 10,
    active: 1,
  },
];

export async function ensureDefaultLookupsAndFields(): Promise<void> {
  const existingLookups = await one<{ count: number }>('SELECT count(*) as count FROM lookups');
  if (!existingLookups || existingLookups.count === 0) {
    for (const l of DEFAULT_LOOKUPS) {
      await run(
        `INSERT OR IGNORE INTO lookups (kind, code, label, label_ne, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [l.kind, l.code, l.label, l.label_ne, l.sort_order, l.active]
      );
    }
  }

  const existingFields = await one<{ count: number }>('SELECT count(*) as count FROM custom_fields');
  if (!existingFields || existingFields.count === 0) {
    for (const f of DEFAULT_CUSTOM_FIELDS) {
      await run(
        `INSERT OR IGNORE INTO custom_fields (entity, key, label, label_ne, type, options, required, visible_roles, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.entity, f.key, f.label, f.label_ne, f.type, f.options, f.required, f.visible_roles, f.sort_order, f.active]
      );
    }
  }
}

export async function listLookups(kind?: string): Promise<LookupRecord[]> {
  await ensureDefaultLookupsAndFields();
  if (kind) {
    return query<LookupRecord>(
      'SELECT * FROM lookups WHERE kind = ? ORDER BY sort_order ASC, label ASC',
      [kind]
    );
  }
  return query<LookupRecord>('SELECT * FROM lookups ORDER BY kind ASC, sort_order ASC, label ASC');
}

export async function saveLookup(item: Partial<LookupRecord>, userId: number): Promise<LookupRecord> {
  if (!item.kind || !item.code || !item.label) {
    throw new HttpError(400, 'kind, code, and label are required for lookup item');
  }

  const codeClean = item.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  await run(
    `INSERT INTO lookups (kind, code, label, label_ne, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(kind, code) DO UPDATE SET
       label = excluded.label,
       label_ne = excluded.label_ne,
       sort_order = excluded.sort_order,
       active = excluded.active`,
    [
      item.kind.trim(),
      codeClean,
      item.label.trim(),
      item.label_ne?.trim() || null,
      item.sort_order ?? 0,
      item.active ?? 1,
    ]
  );

  await audit(userId, 'save_lookup', 'lookups', codeClean, {
    kind: item.kind,
    code: codeClean,
    label: item.label,
  });

  const saved = await one<LookupRecord>(
    'SELECT * FROM lookups WHERE kind = ? AND code = ?',
    [item.kind.trim(), codeClean]
  );
  if (!saved) throw new HttpError(500, 'Failed to save lookup');
  return saved;
}

export async function deleteLookup(id: number, userId: number): Promise<void> {
  const existing = await one<LookupRecord>('SELECT * FROM lookups WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Lookup item not found');

  await run('DELETE FROM lookups WHERE id = ?', [id]);
  await audit(userId, 'delete_lookup', 'lookups', id, {
    kind: existing.kind,
    code: existing.code,
  });
}

export async function listCustomFields(entity?: string): Promise<CustomFieldRecord[]> {
  await ensureDefaultLookupsAndFields();
  if (entity) {
    return query<CustomFieldRecord>(
      'SELECT * FROM custom_fields WHERE entity = ? ORDER BY sort_order ASC, id ASC',
      [entity]
    );
  }
  return query<CustomFieldRecord>('SELECT * FROM custom_fields ORDER BY entity ASC, sort_order ASC, id ASC');
}

export async function saveCustomField(item: Partial<CustomFieldRecord>, userId: number): Promise<CustomFieldRecord> {
  if (!item.entity || !item.key || !item.label || !item.type) {
    throw new HttpError(400, 'entity, key, label, and type are required for custom field');
  }

  const keyClean = item.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  await run(
    `INSERT INTO custom_fields (entity, key, label, label_ne, type, options, required, visible_roles, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(entity, key) DO UPDATE SET
       label = excluded.label,
       label_ne = excluded.label_ne,
       type = excluded.type,
       options = excluded.options,
       required = excluded.required,
       visible_roles = excluded.visible_roles,
       sort_order = excluded.sort_order,
       active = excluded.active`,
    [
      item.entity.trim(),
      keyClean,
      item.label.trim(),
      item.label_ne?.trim() || null,
      item.type.trim(),
      item.options?.trim() || null,
      item.required ? 1 : 0,
      item.visible_roles || null,
      item.sort_order ?? 0,
      item.active ?? 1,
    ]
  );

  await audit(userId, 'save_custom_field', 'custom_fields', keyClean, {
    entity: item.entity,
    key: keyClean,
    label: item.label,
  });

  const saved = await one<CustomFieldRecord>(
    'SELECT * FROM custom_fields WHERE entity = ? AND key = ?',
    [item.entity.trim(), keyClean]
  );
  if (!saved) throw new HttpError(500, 'Failed to save custom field');
  return saved;
}

export async function deleteCustomField(id: number, userId: number): Promise<void> {
  const existing = await one<CustomFieldRecord>('SELECT * FROM custom_fields WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Custom field not found');

  await run('DELETE FROM custom_fields WHERE id = ?', [id]);
  await audit(userId, 'delete_custom_field', 'custom_fields', id, {
    entity: existing.entity,
    key: existing.key,
  });
}
