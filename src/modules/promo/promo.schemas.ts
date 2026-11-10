import { z } from 'zod';

export const validatePromoSchema = z.object({
  code: z.string().min(1, 'Promo code is required').max(30),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
});

export const createPromoSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(30),
  discountType: z.enum(['percentage', 'flat']),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  maxUses: z.number().int().positive().optional().default(100),
  active: z.boolean().optional().default(true),
});

export const updatePromoSchema = createPromoSchema.partial();
