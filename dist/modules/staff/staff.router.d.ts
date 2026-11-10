import { Router } from 'express';
import { BookingRepository } from '../../db/repositories/booking.repository.js';
export declare function createStaffRouter(bookingRepo: BookingRepository): Router;
