import { Router } from 'express';
import { ShowtimeRepository } from '../../db/repositories/showtime.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createShowtimeSchema,
  updateShowtimeSchema,
  cancelShowtimeSchema,
} from './showtime.schemas.js';

export function createShowtimeRouter(repo: ShowtimeRepository): Router {
  const router = Router();

  // Public endpoint: GET /api/showtimes
  router.get('/api/showtimes', (req, res, next) => {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const showtimes = repo.findByDate(date).filter(
        (s) => s.status === 'scheduled' && s.cinemaActive && s.movieActive
      );
      res.json(showtimes);
    } catch (err) {
      next(err);
    }
  });

  // Public endpoint: GET /api/showtimes/:id/seats
  router.get('/api/showtimes/:id/seats', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid showtime ID' });
        return;
      }

      const showtime = repo.findById(id);
      if (!showtime) {
        res.status(404).json({ error: 'Screening not found' });
        return;
      }

      const bookedSeats = repo.getBookedSeats(id);
      const basePrice = showtime.startingPrice || 150;

      res.json({
        showtimeId: id,
        screen: showtime.screen,
        category: showtime.category,
        startingPrice: basePrice,
        bookedSeats,
        pricingTiers: {
          VIP: Math.round(basePrice * 1.5),
          Prime: Math.round(basePrice * 1.2),
          Classic: basePrice,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: GET /api/admin/showtimes?date=YYYY-MM-DD
  router.get('/api/admin/showtimes', requireAdminAuth, (req, res, next) => {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const showtimes = repo.findByDate(date);
      res.json(showtimes);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: POST /api/admin/showtimes
  router.post(
    '/api/admin/showtimes',
    requireAdminAuth,
    validateBody(createShowtimeSchema),
    (req, res, next) => {
      try {
        const created = repo.create(req.body);
        res.status(201).json(created);
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin endpoint: PUT /api/admin/showtimes/:id
  router.put(
    '/api/admin/showtimes/:id',
    requireAdminAuth,
    validateBody(updateShowtimeSchema),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'Invalid showtime ID' });
          return;
        }

        const updated = repo.update(id, req.body);
        if (!updated) {
          res.status(404).json({ error: 'Showtime not found' });
          return;
        }

        res.json(updated);
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin endpoint: POST /api/admin/showtimes/:id/cancel
  router.post(
    '/api/admin/showtimes/:id/cancel',
    requireAdminAuth,
    validateBody(cancelShowtimeSchema),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'Invalid showtime ID' });
          return;
        }

        const result = repo.cancel(id, req.body.reason);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
