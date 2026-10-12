import { query, one, run, batch } from '@/server/db';
import { HttpError } from '@/server/http';
import { audit } from '@/server/audit';
import { validateSectionData } from '@/server/cms/sections';

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  title_ne: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_media_id: number | null;
  status: 'draft' | 'published' | 'archived';
  show_in_nav: number;
  nav_label: string | null;
  nav_label_ne: string | null;
  nav_order: number;
  nav_parent_id: number | null;
  is_system: number;
  published_version_id: number | null;
  updated_by: number | null;
  updated_at: string;
  sections?: CmsSection[];
}

export interface CmsSection {
  id?: number;
  page_id: number;
  type: string;
  sort_order: number;
  visible: number;
  data: Record<string, unknown>;
  schedule_from?: string | null;
  schedule_to?: string | null;
}

export interface CmsVersion {
  id: number;
  page_id: number;
  snapshot: string;
  note: string | null;
  created_by: number | null;
  created_at: string;
}

export async function listPages(options: { includeDrafts?: boolean } = {}): Promise<CmsPage[]> {
  const where = options.includeDrafts ? '' : "WHERE status = 'published'";
  return query<CmsPage>(`SELECT * FROM cms_pages ${where} ORDER BY nav_order ASC, id ASC`);
}

export async function getPageById(id: number): Promise<CmsPage | null> {
  const page = await one<CmsPage>('SELECT * FROM cms_pages WHERE id = ?', [id]);
  if (!page) return null;

  const rawSections = await query<{
    id: number;
    page_id: number;
    type: string;
    sort_order: number;
    visible: number;
    data: string;
    schedule_from: string | null;
    schedule_to: string | null;
  }>('SELECT * FROM cms_sections WHERE page_id = ? ORDER BY sort_order ASC, id ASC', [id]);

  const sections: CmsSection[] = rawSections.map((s) => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(s.data);
    } catch {
      parsed = {};
    }
    return {
      id: s.id,
      page_id: s.page_id,
      type: s.type,
      sort_order: s.sort_order,
      visible: s.visible,
      data: parsed,
      schedule_from: s.schedule_from,
      schedule_to: s.schedule_to,
    };
  });

  page.sections = sections;
  return page;
}

export async function getPageBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {}
): Promise<CmsPage | null> {
  const cleanSlug = slug === '/' ? '' : slug.replace(/^\//, '');
  const page = await one<CmsPage>(
    `SELECT * FROM cms_pages WHERE slug = ? ${options.includeDrafts ? '' : "AND status = 'published'"}`,
    [cleanSlug]
  );
  if (!page) return null;

  const nowIso = new Date().toISOString().slice(0, 10);
  const rawSections = await query<{
    id: number;
    page_id: number;
    type: string;
    sort_order: number;
    visible: number;
    data: string;
    schedule_from: string | null;
    schedule_to: string | null;
  }>(
    `SELECT * FROM cms_sections 
     WHERE page_id = ? 
     ${options.includeDrafts ? '' : 'AND visible = 1'}
     ORDER BY sort_order ASC, id ASC`,
    [page.id]
  );

  const sections: CmsSection[] = [];
  for (const s of rawSections) {
    if (!options.includeDrafts) {
      if (s.schedule_from && s.schedule_from > nowIso) continue;
      if (s.schedule_to && s.schedule_to < nowIso) continue;
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(s.data);
    } catch {
      parsed = {};
    }

    sections.push({
      id: s.id,
      page_id: s.page_id,
      type: s.type,
      sort_order: s.sort_order,
      visible: s.visible,
      data: parsed,
      schedule_from: s.schedule_from,
      schedule_to: s.schedule_to,
    });
  }

  page.sections = sections;
  return page;
}

export async function savePage(
  id: number | null,
  pageData: {
    slug: string;
    title: string;
    title_ne?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_image_media_id?: number | null;
    status?: 'draft' | 'published' | 'archived';
    show_in_nav?: number;
    nav_label?: string | null;
    nav_label_ne?: string | null;
    nav_order?: number;
    is_system?: number;
  },
  sections: Array<{
    type: string;
    sort_order: number;
    visible: number;
    data: Record<string, unknown>;
    schedule_from?: string | null;
    schedule_to?: string | null;
  }>,
  userId: number
): Promise<CmsPage> {
  const cleanSlug = pageData.slug === '/' ? '' : pageData.slug.replace(/^\//, '').trim();

  let targetId = id;

  if (targetId) {
    await run(
      `UPDATE cms_pages SET
        slug = ?, title = ?, title_ne = ?,
        seo_title = ?, seo_description = ?, seo_image_media_id = ?,
        status = ?, show_in_nav = ?, nav_label = ?, nav_label_ne = ?,
        nav_order = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [
        cleanSlug,
        pageData.title.trim(),
        pageData.title_ne?.trim() || null,
        pageData.seo_title?.trim() || null,
        pageData.seo_description?.trim() || null,
        pageData.seo_image_media_id ?? null,
        pageData.status ?? 'draft',
        pageData.show_in_nav ?? 0,
        pageData.nav_label?.trim() || null,
        pageData.nav_label_ne?.trim() || null,
        pageData.nav_order ?? 100,
        userId,
        targetId,
      ]
    );
  } else {
    // Check if slug taken
    const existing = await one<{ id: number }>('SELECT id FROM cms_pages WHERE slug = ?', [cleanSlug]);
    if (existing) {
      throw new HttpError(400, `Page slug "${cleanSlug}" is already in use.`);
    }

    const res = await run(
      `INSERT INTO cms_pages (
        slug, title, title_ne, seo_title, seo_description, seo_image_media_id,
        status, show_in_nav, nav_label, nav_label_ne, nav_order,
        is_system, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        cleanSlug,
        pageData.title.trim(),
        pageData.title_ne?.trim() || null,
        pageData.seo_title?.trim() || null,
        pageData.seo_description?.trim() || null,
        pageData.seo_image_media_id ?? null,
        pageData.status ?? 'draft',
        pageData.show_in_nav ?? 0,
        pageData.nav_label?.trim() || null,
        pageData.nav_label_ne?.trim() || null,
        pageData.nav_order ?? 100,
        pageData.is_system ?? 0,
        userId,
      ]
    );
    targetId = Number(res.lastInsertRowid);
  }

  // Update sections: delete existing sections for this page and replace
  await run('DELETE FROM cms_sections WHERE page_id = ?', [targetId]);

  if (sections && sections.length > 0) {
    const sectionStatements = sections.map((sec, idx) => {
      const validated = validateSectionData(sec.type, sec.data);
      return {
        sql: `INSERT INTO cms_sections (
          page_id, type, sort_order, visible, data, schedule_from, schedule_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          targetId!,
          sec.type,
          sec.sort_order ?? idx + 1,
          sec.visible ?? 1,
          JSON.stringify(validated),
          sec.schedule_from || null,
          sec.schedule_to || null,
        ],
      };
    });
    await batch(sectionStatements);
  }

  await audit(userId, targetId === id ? 'update' : 'create', 'cms_page', targetId, {
    slug: cleanSlug,
    sections_count: sections.length,
  });

  const saved = await getPageById(targetId);
  if (!saved) throw new HttpError(500, 'Failed to retrieve saved CMS page.');
  return saved;
}

export async function publishPage(id: number, userId: number, note?: string): Promise<CmsPage> {
  const page = await getPageById(id);
  if (!page) throw new HttpError(404, 'Page not found.');

  // Create version snapshot
  const snapshotJson = JSON.stringify(page);
  const versionRes = await run(
    `INSERT INTO cms_versions (page_id, snapshot, note, created_by, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [id, snapshotJson, note?.trim() || 'Published live version', userId]
  );
  const versionId = Number(versionRes.lastInsertRowid);

  // Update page status and published_version_id
  await run(
    `UPDATE cms_pages SET
      status = 'published',
      published_version_id = ?,
      updated_by = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
    [versionId, userId, id]
  );

  // Maintain max 50 versions per page
  const versions = await query<{ id: number }>(
    'SELECT id FROM cms_versions WHERE page_id = ? ORDER BY id DESC',
    [id]
  );
  if (versions.length > 50) {
    const toRemove = versions.slice(50).map((v) => v.id);
    for (const vid of toRemove) {
      await run('DELETE FROM cms_versions WHERE id = ?', [vid]);
    }
  }

  await audit(userId, 'publish', 'cms_page', id, { version_id: versionId, note });

  const published = await getPageById(id);
  if (!published) throw new HttpError(500, 'Failed to fetch published page.');
  return published;
}

export async function revertPageToVersion(
  pageId: number,
  versionId: number,
  userId: number
): Promise<CmsPage> {
  const version = await one<CmsVersion>(
    'SELECT * FROM cms_versions WHERE id = ? AND page_id = ?',
    [versionId, pageId]
  );
  if (!version) throw new HttpError(404, 'Version snapshot not found.');

  const snapshot: CmsPage = JSON.parse(version.snapshot);

  await savePage(
    pageId,
    {
      slug: snapshot.slug,
      title: snapshot.title,
      title_ne: snapshot.title_ne,
      seo_title: snapshot.seo_title,
      seo_description: snapshot.seo_description,
      seo_image_media_id: snapshot.seo_image_media_id,
      status: 'draft',
      show_in_nav: snapshot.show_in_nav,
      nav_label: snapshot.nav_label,
      nav_label_ne: snapshot.nav_label_ne,
      nav_order: snapshot.nav_order,
      is_system: snapshot.is_system,
    },
    snapshot.sections || [],
    userId
  );

  await audit(userId, 'revert', 'cms_page', pageId, { reverted_to_version: versionId });

  const reverted = await getPageById(pageId);
  if (!reverted) throw new HttpError(500, 'Failed to load reverted page.');
  return reverted;
}

export async function listPageVersions(pageId: number): Promise<CmsVersion[]> {
  return query<CmsVersion>(
    'SELECT id, page_id, note, created_by, created_at FROM cms_versions WHERE page_id = ? ORDER BY id DESC',
    [pageId]
  );
}

export async function deletePage(id: number, userId: number): Promise<void> {
  const page = await getPageById(id);
  if (!page) throw new HttpError(404, 'Page not found.');

  if (page.is_system === 1) {
    throw new HttpError(400, 'System pages (such as Home, About, Admissions) cannot be deleted.');
  }

  await run('DELETE FROM cms_sections WHERE page_id = ?', [id]);
  await run('DELETE FROM cms_versions WHERE page_id = ?', [id]);
  await run('DELETE FROM cms_pages WHERE id = ?', [id]);

  await audit(userId, 'delete', 'cms_page', id, { slug: page.slug, title: page.title });
}
