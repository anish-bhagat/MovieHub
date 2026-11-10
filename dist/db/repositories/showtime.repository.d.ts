import { DatabaseSync } from 'node:sqlite';
import { Showtime, CreateShowtimeDTO, UpdateShowtimeDTO } from '../../types/index.js';
export declare class ShowtimeRepository {
    private db;
    constructor(db: DatabaseSync);
    private mapRow;
    findByDate(date?: string): Showtime[];
    findById(id: number): Showtime | null;
    create(data: CreateShowtimeDTO): Showtime;
    update(id: number, data: UpdateShowtimeDTO): Showtime | null;
    cancel(id: number, reason: string): {
        affectedBookings: number;
    };
    countUpcoming(): number;
    getBookedSeats(showtimeId: number): string[];
    toggleSeatBlock(showtimeId: number, rawSeatId: string): {
        blockedSeats: string[];
        action: 'blocked' | 'unblocked';
    };
    getHallOccupancy(showtimeId: number): {
        showtime: Showtime;
        seatDetails: Record<string, {
            status: "checked_in" | "confirmed";
            customerName: string;
            ticketCode: string;
        }>;
        blockedSeats: string[];
    };
}
