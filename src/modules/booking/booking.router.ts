import { Router } from 'express';
import crypto from 'node:crypto';
import { BookingRepository } from '../../db/repositories/booking.repository.js';
import { CinemaRepository } from '../../db/repositories/cinema.repository.js';
import { MovieRepository } from '../../db/repositories/movie.repository.js';
import { ShowtimeRepository } from '../../db/repositories/showtime.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  recordRefundSchema,
  issueReplacementSchema,
  createBookingSchema,
} from './booking.schemas.js';

export function createBookingRouter(
  bookingRepo: BookingRepository,
  cinemaRepo: CinemaRepository,
  movieRepo: MovieRepository,
  showtimeRepo: ShowtimeRepository
): Router {
  const router = Router();

  // Admin endpoint: GET /api/admin/summary
  router.get('/api/admin/summary', requireAdminAuth, (_req, res, next) => {
    try {
      const summary = {
        cinemas: cinemaRepo.countActive(),
        movies: movieRepo.countActive(),
        upcomingShowtimes: showtimeRepo.countUpcoming(),
        confirmedTickets: bookingRepo.countConfirmed(),
      };
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: GET /api/admin/bookings?showtime_id=...
  router.get('/api/admin/bookings', requireAdminAuth, (req, res, next) => {
    try {
      const showtimeId = req.query.showtime_id ? Number(req.query.showtime_id) : undefined;
      const bookings = bookingRepo.findAll(showtimeId);
      res.json(bookings);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: POST /api/admin/bookings/:id/refund
  router.post(
    '/api/admin/bookings/:id/refund',
    requireAdminAuth,
    validateBody(recordRefundSchema),
    (req, res, next) => {
      try {
        const id = req.params.id;
        const result = bookingRepo.recordRefund(id, req.body.refundReference);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin endpoint: POST /api/admin/bookings/:id/replacement
  router.post(
    '/api/admin/bookings/:id/replacement',
    requireAdminAuth,
    validateBody(issueReplacementSchema),
    (req, res, next) => {
      try {
        const id = req.params.id;
        const result = bookingRepo.issueReplacement(id, req.body.showtimeId);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  // Public endpoint: GET /api/bookings/lookup?query=...
  router.get('/api/bookings/lookup', (req, res, next) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query : '';
      if (!query.trim()) {
        res.status(400).json({ error: 'Search query (ticket code or email) is required.' });
        return;
      }

      const results = bookingRepo.lookupBookings(query);
      res.json(results);
    } catch (err) {
      next(err);
    }
  });

  // Public endpoint: POST /api/bookings (for customer simulation)
  router.post(
    '/api/bookings',
    validateBody(createBookingSchema),
    (req, res, next) => {
      try {
        const showtime = showtimeRepo.findById(req.body.showtimeId);
        if (!showtime) {
          res.status(404).json({ error: 'Screening not found' });
          return;
        }

        // Check if any requested seat is already booked
        const alreadyBooked = showtimeRepo.getBookedSeats(req.body.showtimeId);
        const requestedUpper = req.body.seats.map((s: string) => s.trim().toUpperCase());
        const collisions = requestedUpper.filter((s: string) => alreadyBooked.includes(s));

        if (collisions.length > 0) {
          res.status(409).json({
            error: `Seat(s) ${collisions.join(', ')} are already booked for this screening.`,
            occupiedSeats: collisions,
          });
          return;
        }

        const ticketCode = bookingRepo.generateTicketCode();
        const bookingId = crypto.randomUUID();

        (bookingRepo as any).db.prepare(`
          INSERT INTO bookings (id, ticket_code, showtime_id, customer_name, email, seats, snacks, total, status, payment_status, payment_method, resolution_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'demo_paid', ?, 'none')
        `).run(
          bookingId,
          ticketCode,
          req.body.showtimeId,
          req.body.customerName,
          req.body.email,
          JSON.stringify(req.body.seats),
          JSON.stringify(req.body.snacks || []),
          req.body.total,
          req.body.paymentMethod || 'Simulated UPI'
        );

        const created = bookingRepo.findById(bookingId);
        res.status(201).json(created);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
