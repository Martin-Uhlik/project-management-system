import type { Request } from 'express';
import { z } from 'zod';
import { badRequest } from './errors.ts';

// A positive whole-number ID from the URL (/projects/:projectID), or 400
export const idParam = (req: Request, name: string) => {
    const parsed = z.coerce.number().int().positive().safeParse(req.params[name]);
    if (!parsed.success) throw badRequest(`Neplatné ID v adrese (${name}).`);
    return parsed.data;
};

export const id = z.number().int().positive();
export const text = (max = 1000) => z.string().trim().max(max);
export const requiredText = (max = 200) => z.string().trim().min(1).max(max);
export const date = z.coerce.date();
export const count = z.number().int().positive().max(1_000_000);

// Parses the request body against an allowlist schema; unknown fields are dropped, wrong types give 400
export const parseBody = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> => schema.parse(body ?? {});

// The keys the client actually sent (so PATCH only touches those, and permissions can depend on them)
export const sentKeys = (body: unknown) => (body && typeof body === 'object' ? Object.keys(body) : []);
