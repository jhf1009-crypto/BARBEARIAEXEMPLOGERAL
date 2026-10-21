import { z } from 'zod';
export const id = z.string().min(1).max(100);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)));
export const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10,13}$/, 'Informe um WhatsApp válido com DDD.'));
export const bookingSchema = z.object({
  serviceIds: z.array(id).min(1).max(10),
  barberId: id.optional(),
  startsAt: z.iso.datetime(),
  name: z.string().trim().min(3).max(100),
  phone,
  notes: z.string().max(500).default(''),
  website: z.string().max(0).default(''),
  consent: z.literal(true),
  turnstile: z.string().max(2048).optional(),
});
export const statusSchema = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
export const schemas = {
  services: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).default(''),
    price: z.coerce.number().int().min(100).max(100000),
    duration: z.coerce.number().int().min(5).max(480),
    image: z.string().regex(/^\/(images|uploads)\/[\w.-]+$/),
    category: z.string().max(60).default('Cabelo'),
    active: z.boolean().default(true),
    order: z.coerce.number().int().min(0).default(0),
    barberIds: z
      .string()
      .max(1000)
      .refine((v) => {
        try {
          return z.array(id).max(50).safeParse(JSON.parse(v)).success;
        } catch {
          return false;
        }
      })
      .default('[]'),
  }),
  barbers: z.object({
    name: z.string().min(2).max(100),
    bio: z.string().max(500).default(''),
    specialty: z.string().max(150),
    image: z.string().regex(/^\/(images|uploads)\/[\w.-]+$/),
    commission: z.coerce.number().int().min(0).max(100),
    active: z.boolean().default(true),
    schedule: z
      .string()
      .max(4000)
      .refine((v) => {
        try {
          const s = JSON.parse(v);
          return Object.entries(s).every(
            ([d, r]) =>
              /^[0-6]$/.test(d) &&
              Array.isArray(r) &&
              r.every(
                (p: unknown) =>
                  Array.isArray(p) &&
                  p.length === 2 &&
                  p.every((n) => Number.isInteger(n) && n >= 0 && n <= 1440) &&
                  p[0] < p[1],
              ),
          );
        } catch {
          return false;
        }
      }, 'Use JSON: {"1":[[540,720],[780,1200]]}'),
  }),
  customers: z.object({
    name: z.string().min(2).max(100),
    phone,
    notes: z.string().max(1000).default(''),
    tags: z.string().max(200).default(''),
  }),
  blocks: z
    .object({
      name: z.string().min(2).max(100),
      barberId: z.string().nullable().default(null),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
    })
    .refine((v) => v.endsAt > v.startsAt, 'O fim deve ser posterior ao início.'),
  gallery: z.object({
    caption: z.string().min(2).max(150),
    image: z.string().regex(/^\/(images|uploads)\/[\w.-]+$/),
    active: z.boolean().default(true),
    order: z.coerce.number().int().min(0).default(0),
  }),
  reviews: z.object({
    name: z.string().min(2).max(100),
    text: z.string().min(3).max(600),
    rating: z.coerce.number().int().min(1).max(5),
    active: z.boolean().default(true),
  }),
  users: z.object({
    name: z.string().min(2).max(100),
    email: z.email(),
    password: z.string().min(12).max(128).optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'BARBER']),
    barberId: z.string().nullable().default(null),
  }),
};
export type BookingInput = z.infer<typeof bookingSchema>;
