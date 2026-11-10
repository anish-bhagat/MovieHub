import { Router } from 'express';
import { BookingRepository } from '../../db/repositories/booking.repository.js';
import { ShowtimeRepository } from '../../db/repositories/showtime.repository.js';
export declare function createAnalyticsRouter(bookingRepo: BookingRepository, showtimeRepo: ShowtimeRepository): Router;
