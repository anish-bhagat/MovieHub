import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { CinemaRepository } from './db/repositories/cinema.repository.js';
import { MovieRepository } from './db/repositories/movie.repository.js';
import { ShowtimeRepository } from './db/repositories/showtime.repository.js';
import { BookingRepository } from './db/repositories/booking.repository.js';
import { SnackRepository } from './db/repositories/snack.repository.js';
import { PromoRepository } from './db/repositories/promo.repository.js';

import { createCinemaRouter } from './modules/cinema/cinema.router.js';
import { createMovieRouter } from './modules/movie/movie.router.js';
import { createShowtimeRouter } from './modules/showtime/showtime.router.js';
import { createBookingRouter } from './modules/booking/booking.router.js';
import { createStaffRouter } from './modules/staff/staff.router.js';
import { createHealthRouter } from './modules/health/health.router.js';
import { createSnackRouter } from './modules/snack/snack.router.js';
import { createPromoRouter } from './modules/promo/promo.router.js';
import { createAnalyticsRouter } from './modules/admin/analytics.router.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(db: DatabaseSync): Express {
  const app = express();

  // Security headers configured to allow fonts and camera/video if needed
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows inline fonts and camera streams in admin panel
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Repositories
  const cinemaRepo = new CinemaRepository(db);
  const movieRepo = new MovieRepository(db);
  const showtimeRepo = new ShowtimeRepository(db);
  const bookingRepo = new BookingRepository(db);
  const snackRepo = new SnackRepository(db);
  const promoRepo = new PromoRepository(db);

  // Mount API Routers
  app.use(createHealthRouter());
  app.use(createCinemaRouter(cinemaRepo));
  app.use(createMovieRouter(movieRepo));
  app.use(createShowtimeRouter(showtimeRepo));
  app.use(createBookingRouter(bookingRepo, cinemaRepo, movieRepo, showtimeRepo));
  app.use(createStaffRouter(bookingRepo));
  app.use(createSnackRouter(snackRepo));
  app.use(createPromoRouter(promoRepo));
  app.use(createAnalyticsRouter(bookingRepo, showtimeRepo));

  // Serve static files from public directory
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Serve admin page explicitly on /admin
  app.get('/admin', (_req, res) => {
    res.sendFile(path.join(publicDir, 'admin', 'index.html'));
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
