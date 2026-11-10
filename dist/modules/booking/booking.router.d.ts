import { Router } from 'express';
import { BookingRepository } from '../../db/repositories/booking.repository.js';
import { CinemaRepository } from '../../db/repositories/cinema.repository.js';
import { MovieRepository } from '../../db/repositories/movie.repository.js';
import { ShowtimeRepository } from '../../db/repositories/showtime.repository.js';
export declare function createBookingRouter(bookingRepo: BookingRepository, cinemaRepo: CinemaRepository, movieRepo: MovieRepository, showtimeRepo: ShowtimeRepository): Router;
