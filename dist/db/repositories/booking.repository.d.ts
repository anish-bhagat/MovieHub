import { DatabaseSync } from 'node:sqlite';
import { Booking, ScanLog, AnalyticsSummary } from '../../types/index.js';
export declare class BookingRepository {
    private db;
    constructor(db: DatabaseSync);
    private mapRow;
    generateTicketCode(): string;
    findAll(showtimeId?: number): Booking[];
    findById(id: string): Booking | null;
    findByTicketCode(code: string): Booking | null;
    recordRefund(id: string, refundReference: string): {
        actualMoneyMoved: boolean;
        refundAmount: number;
        refundReference: string;
    };
    issueReplacement(originalBookingId: string, targetShowtimeId: number): {
        ticketCode: string;
        title: string;
        cinema: string;
        city: string;
        date: string;
        time: string;
    };
    private logScan;
    getRecentScanLogs(limit?: number): ScanLog[];
    validateAndCheckIn(ticketCode: string): {
        ticketCode: string;
        customerName: string;
        movie: string;
        seats: string[];
    };
    getAnalytics(range?: 'today' | '7days' | '30days' | 'all'): AnalyticsSummary;
    lookupBookings(query: string): Booking[];
    countConfirmed(): number;
}
