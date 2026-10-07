import { createClient, type Client, type InArgs } from '@libsql/client';

let client: Client | null = null;
let foreignKeysEnabled = false;

export function db(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL ?? 'file:data/balodaya.db';
    client = createClient({ url });
  }

  if (!foreignKeysEnabled && client) {
    foreignKeysEnabled = true;
    client.execute('PRAGMA foreign_keys = ON').catch(() => {
      // Ignore if pragma is already applied
    });
  }

  return client;
}

export async function query<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const result = await db().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  const result = await db().execute({ sql, args });
  if (result.rows.length === 0) return undefined;
  return result.rows[0] as unknown as T;
}

export async function run(
  sql: string,
  args: InArgs = []
): Promise<{ lastInsertRowid: bigint | number; rowsAffected: number }> {
  const result = await db().execute({ sql, args });
  return {
    lastInsertRowid: result.lastInsertRowid ?? 0,
    rowsAffected: result.rowsAffected,
  };
}
