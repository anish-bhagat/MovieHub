import { Router } from 'express';
import { z } from 'zod';
import { BookingRepository } from '../../db/repositories/booking.repository.js';
import { ShowtimeRepository } from '../../db/repositories/showtime.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const blockSeatSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required').max(10),
});

export function createAnalyticsRouter(bookingRepo: BookingRepository, showtimeRepo: ShowtimeRepository): Router {
  const router = Router();

  // Financial & Revenue Analytics
  router.get('/api/admin/analytics', requireAdminAuth, (req, res, next) => {
    try {
      const range = (req.query.range as 'today' | '7days' | '30days' | 'all') || 'all';
      const stats = bookingRepo.getAnalytics(range);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  });

  // Door Check-In Attendance Log & Audit Feed
  router.get('/api/admin/scan-logs', requireAdminAuth, (req, res, next) => {
    try {
      const limit = Number(req.query.limit) || 30;
      const logs = bookingRepo.getRecentScanLogs(limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  // Live Hall Occupancy Inspector
  router.get('/api/admin/showtimes/:id/occupancy', requireAdminAuth, (req, res, next) => {
    try {
      const showtimeId = Number(req.params.id);
      if (isNaN(showtimeId)) {
        res.status(400).json({ error: 'Invalid screening ID' });
        return;
      }
      const data = showtimeRepo.getHallOccupancy(showtimeId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Manual Staff Seat Blocking
  router.post(
    '/api/admin/showtimes/:id/seats/block',
    requireAdminAuth,
    validateBody(blockSeatSchema),
    (req, res, next) => {
      try {
        const showtimeId = Number(req.params.id);
        if (isNaN(showtimeId)) {
          res.status(400).json({ error: 'Invalid screening ID' });
          return;
        }
        const result = showtimeRepo.toggleSeatBlock(showtimeId, req.body.seatId);
        res.json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message || 'Failed to toggle seat block' });
      }
    }
  );

  return router;
}
