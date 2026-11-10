import { z } from 'zod';

export const createSnackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  icon: z.string().max(10).optional().default('🍿'),
  price: z.number().positive('Price must be greater than 0'),
  inStock: z.boolean().optional().default(true),
  category: z.string().max(50).optional().default('Snacks'),
  description: z.string().max(250).optional().default(''),
});

export const updateSnackSchema = createSnackSchema.partial();
