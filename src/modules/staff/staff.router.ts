import { Router } from 'express';
import { BookingRepository } from '../../db/repositories/booking.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { scanTicketSchema } from './staff.schemas.js';

export function createStaffRouter(bookingRepo: BookingRepository): Router {
  const router = Router();

  // Staff endpoint: POST /api/staff/scan
  router.post(
    '/api/staff/scan',
    requireAdminAuth,
    validateBody(scanTicketSchema),
    (req, res, next) => {
      try {
        const result = bookingRepo.validateAndCheckIn(req.body.ticketCode);
        res.json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message || 'Validation failed' });
      }
    }
  );

  return router;
}
