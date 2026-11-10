import { z } from 'zod';

export const createShowtimeSchema = z.object({
  cinemaId: z.coerce.number().int().positive('Valid cinemaId is required'),
  movieId: z.coerce.number().int().positive('Valid movieId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  time: z.string().min(1, 'Screening time is required'),
  category: z.string().min(1).max(40).default('Regular'),
  screen: z.string().min(1).max(30).default('Screen 01'),
  startingPrice: z.coerce.number().min(0).max(100000).default(150),
});

export const updateShowtimeSchema = createShowtimeSchema.partial();

export const cancelShowtimeSchema = z.object({
  reason: z.string().min(1, 'Reason for cancellation is required').max(500),
});
