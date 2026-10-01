import { z } from 'zod';
import { sizes } from './catalog';
export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.'),
  name: z.string().trim().min(2).max(100),
  caption: z.string().trim().min(2).max(1000),
  price: z.number().int().min(100).max(100000000),
  color: z.string().trim().min(1).max(50),
  imageUrl: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (value) =>
        !value ||
        /^\/api\/product-images\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
          value,
        ) ||
        /^\/images\/[a-zA-Z0-9/_.-]+$/.test(value) ||
        (() => {
          try {
            const url = new URL(value);
            return url.protocol === 'https:' && !url.username && !url.password;
          } catch {
            return false;
          }
        })(),
      'Use an HTTPS image URL or a /images/ path.',
    ),
  availableSizes: z
    .array(z.enum(sizes))
    .min(1)
    .max(5)
    .refine((values) => new Set(values).size === values.length, 'Sizes must be unique.'),
  active: z.boolean(),
  design: z.enum(['off duty', 'cherry', 'wish', 'romanticize']),
  ink: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  bg: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  sub: z.string().trim().max(100).default(''),
  tag: z.string().trim().max(100).default(''),
});
