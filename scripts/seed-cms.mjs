import { seedCmsDefaultsIfEmpty } from '../src/server/cms/seed.ts';
import { query } from '../src/server/db.ts';

console.log('--- Seeding Balodaya CMS Pages & Sections ---');
const seeded = await seedCmsDefaultsIfEmpty();
if (seeded) {
  console.log('CMS defaults successfully seeded into database!');
} else {
  console.log('CMS pages already exist in database.');
}

const pages = await query('SELECT id, slug, title, status FROM cms_pages ORDER BY id ASC');
console.log(`\nActive CMS Pages in database (${pages.length}):`);
for (const p of pages) {
  console.log(`  [#${p.id}] /${p.slug} - ${p.title} (${p.status})`);
}

process.exit(0);
