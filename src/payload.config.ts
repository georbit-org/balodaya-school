import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';

import { HeroSlides } from './collections/HeroSlides';
import { Notices } from './collections/Notices';
import { Facilities } from './collections/Facilities';
import { Leadership } from './collections/Leadership';
import { Inquiries } from './collections/Inquiries';
import { Applications } from './collections/Applications';
import { Media } from './collections/Media';
import { Users } from './collections/Users';
import { SiteSettings } from './globals/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Determine database adapter: Prefer PostgreSQL if DATABASE_URI is defined, else use SQLite for portable local operation
const dbAdapter = process.env.DATABASE_URI
  ? postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URI,
      },
    })
  : sqliteAdapter({
      client: {
        url: process.env.SQLITE_URL || 'file:./balodaya_payload.db',
      },
    });

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    HeroSlides,
    Notices,
    Facilities,
    Leadership,
    Inquiries,
    Applications,
    Media,
    Users,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'balodaya-oxford-dais-secret-key-2063-neb-np',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: dbAdapter,
});
