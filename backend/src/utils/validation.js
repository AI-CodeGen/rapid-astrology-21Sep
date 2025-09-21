import { z } from 'zod';

export const nameNumberSchema = z.object({
  name: z.string().min(1).max(120)
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map(i => i.message).join(', ');
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return result.data;
}
