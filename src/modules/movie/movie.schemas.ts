import { z } from 'zod';

export const createMovieSchema = z.object({
  name: z.string().min(1, 'Movie name is required').max(160),
  releaseYear: z.coerce.number().min(1888).max(2100),
  genre: z.string().min(1, 'Genre is required').max(160),
  durationMinutes: z.coerce.number().min(1).max(600),
  rating: z.coerce.number().min(0).max(10),
  languages: z.array(z.string()).default([]),
  certificate: z.string().max(24).default('U/A'),
  posterUrl: z.string().max(1200).optional().nullable(),
  art: z.string().default('art-ember'),
  description: z.string().max(1800).default(''),
  active: z.boolean().default(true),
});

export const updateMovieSchema = createMovieSchema.partial();
