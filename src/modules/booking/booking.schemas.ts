import { z } from 'zod';

export const recordRefundSchema = z.object({
  refundReference: z.string().min(1, 'Refund reference is required').max(120),
});

export const issueReplacementSchema = z.object({
  showtimeId: z.coerce.number().int().positive('Valid showtimeId is required'),
});

export const snackItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  qty: z.coerce.number().int().min(1),
  price: z.coerce.number().min(0),
});

export const createBookingSchema = z.object({
  showtimeId: z.coerce.number().int().positive(),
  customerName: z.string().min(1).max(120),
  email: z.string().email(),
  seats: z.array(z.string()).min(1),
  snacks: z.array(snackItemSchema).default([]),
  total: z.coerce.number().min(0),
  paymentMethod: z.string().default('Simulated UPI'),
});
