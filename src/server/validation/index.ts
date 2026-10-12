import { z, ZodType } from 'zod';
import { HttpError } from '@/server/http';

export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.join('.') || 'root';
      if (!fields[fieldPath]) {
        fields[fieldPath] = issue.message;
      }
    }
    const firstMessage = result.error.issues[0]?.message || 'Validation failed';
    throw new HttpError(400, firstMessage, fields);
  }
  return result.data;
}

export { z };
