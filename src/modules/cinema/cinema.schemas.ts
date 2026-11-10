import { z } from 'zod';

export const createCinemaSchema = z.object({
  name: z.string().min(1, 'Cinema name is required').max(120),
  city: z.string().min(1, 'City is required').max(80),
  address: z.string().min(1, 'Street address is required').max(240),
  mapUrl: z.string().max(1200).optional().nullable(),
  amenities: z.array(z.string()).default([]),
  lateNight: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updateCinemaSchema = createCinemaSchema.partial();
