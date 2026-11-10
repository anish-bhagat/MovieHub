import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { Booking, ScanLog, AnalyticsSummary } from '../../types/index.js';

interface BookingRow {
  id: string;
  ticket_code: string | null;
  showtime_id: number;
  customer_name: string;
  email: string;
  seats: string;
  snacks?: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  resolution_status: string;
  refund_amount: number;
  refund_reference: string | null;
  replacement_ticket_code: string | null;
  checked_in_at: string | null;
  movie_name?: string;
  show_date?: string;
  show_time?: string;
  cinema_name?: string;
  created_at: string;
  updated_at: string;
}

export class BookingRepository {
  constructor(private db: DatabaseSync) {}

  private mapRow(row: BookingRow): Booking {
    let seats: string[] = [];
    try {
      seats = JSON.parse(row.seats || '[]');
    } catch {
      seats = [];
    }

    let snacks: any[] = [];
    try {
      snacks = JSON.parse(row.snacks || '[]');
    } catch {
      snacks = [];
    }

    return {
      id: row.id,
      ticketCode: row.ticket_code,
      showtimeId: row.showtime_id,
      customerName: row.customer_name,
      email: row.email,
      seats,
      snacks,
      total: row.total,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      resolutionStatus: row.resolution_status,
      refundAmount: row.refund_amount || 0,
      refundReference: row.refund_reference,
      replacementTicketCode: row.replacement_ticket_code,
      movie: row.movie_name,
      date: row.show_date,
      time: row.show_time,
      cinema: row.cinema_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  generateTicketCode(): string {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `MOVIEHUB-${randomHex}-${randomChars}`;
  }

  findAll(showtimeId?: number): Booking[] {
    let query = `
      SELECT b.*,
             m.name as movie_name,
             s.date as show_date,
             s.time as show_time,
             c.name as cinema_name
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
    `;

    const params: (string | number)[] = [];
    if (showtimeId) {
      query += ` WHERE b.showtime_id = ?`;
      params.push(showtimeId);
    }

    query += ` ORDER BY b.created_at DESC`;

    const rows = this.db.prepare(query).all(...params) as unknown as BookingRow[];
    return rows.map((r) => this.mapRow(r));
  }

  findById(id: string): Booking | null {
    const query = `
      SELECT b.*,
             m.name as movie_name,
             s.date as show_date,
             s.time as show_time,
             c.name as cinema_name
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE b.id = ?
    `;

    const row = this.db.prepare(query).get(id) as unknown as BookingRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  findByTicketCode(code: string): Booking | null {
    const query = `
      SELECT b.*,
             m.name as movie_name,
             s.date as show_date,
             s.time as show_time,
             s.status as showtime_status,
             c.name as cinema_name
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE UPPER(b.ticket_code) = UPPER(?)
    `;

    const row = this.db.prepare(query).get(code.trim()) as unknown as BookingRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  recordRefund(id: string, refundReference: string): { actualMoneyMoved: boolean; refundAmount: number; refundReference: string } {
    const booking = this.findById(id);
    if (!booking) throw new Error('Booking not found');

    const refundAmount = booking.total;
    this.db.prepare(`
      UPDATE bookings
      SET resolution_status = 'demo_refund_recorded',
          refund_amount = ?,
          refund_reference = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(refundAmount, refundReference, id);

    return {
      actualMoneyMoved: false,
      refundAmount,
      refundReference,
    };
  }

  issueReplacement(originalBookingId: string, targetShowtimeId: number): {
    ticketCode: string;
    title: string;
    cinema: string;
    city: string;
    date: string;
    time: string;
  } {
    const original = this.findById(originalBookingId);
    if (!original) throw new Error('Original booking not found');

    const targetRow = this.db.prepare(`
      SELECT s.*, m.name as movie_name, c.name as cinema_name, c.city as cinema_city
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE s.id = ?
    `).get(targetShowtimeId) as { movie_name: string; cinema_name: string; cinema_city: string; date: string; time: string; status: string } | undefined;

    if (!targetRow) throw new Error('Target screening not found');
    if (targetRow.status === 'cancelled') throw new Error('Target screening is cancelled');

    const newTicketCode = this.generateTicketCode();
    const newBookingId = crypto.randomUUID();

    this.db.exec('BEGIN TRANSACTION;');
    try {
      // Mark original booking resolved
      this.db.prepare(`
        UPDATE bookings
        SET resolution_status = 'replacement_issued',
            replacement_ticket_code = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(newTicketCode, originalBookingId);

      // Create new comped replacement ticket
      this.db.prepare(`
        INSERT INTO bookings (id, ticket_code, showtime_id, customer_name, email, seats, total, status, payment_status, payment_method, resolution_status)
        VALUES (?, ?, ?, ?, ?, ?, 0.0, 'confirmed', 'comped', 'Complimentary Replacement', 'none')
      `).run(
        newBookingId,
        newTicketCode,
        targetShowtimeId,
        original.customerName,
        original.email,
        JSON.stringify(original.seats)
      );

      this.db.exec('COMMIT;');

      return {
        ticketCode: newTicketCode,
        title: targetRow.movie_name,
        cinema: targetRow.cinema_name,
        city: targetRow.cinema_city,
        date: targetRow.date,
        time: targetRow.time,
      };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  private logScan(
    ticketCode: string,
    customerName: string | null,
    movie: string | null,
    seats: string | null,
    status: 'valid' | 'duplicate' | 'invalid'
  ): void {
    try {
      this.db.prepare(`
        INSERT INTO scan_logs (ticket_code, customer_name, movie, seats, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(ticketCode, customerName, movie, seats, status);
    } catch (e) {
      console.error('Failed to write scan log:', e);
    }
  }

  getRecentScanLogs(limit = 25): ScanLog[] {
    const rows = this.db.prepare(`
      SELECT * FROM scan_logs ORDER BY id DESC LIMIT ?
    `).all(limit) as { id: number; ticket_code: string; customer_name: string | null; movie: string | null; seats: string | null; status: 'valid' | 'duplicate' | 'invalid'; timestamp: string }[];

    return rows.map((r) => ({
      id: r.id,
      ticketCode: r.ticket_code,
      customerName: r.customer_name,
      movie: r.movie,
      seats: r.seats,
      status: r.status,
      timestamp: r.timestamp,
    }));
  }

  validateAndCheckIn(ticketCode: string): { ticketCode: string; customerName: string; movie: string; seats: string[] } {
    const booking = this.findByTicketCode(ticketCode);
    if (!booking) {
      this.logScan(ticketCode, null, null, null, 'invalid');
      throw new Error('Invalid ticket code. No matching reservation found.');
    }

    if (booking.status === 'cancelled') {
      this.logScan(ticketCode, booking.customerName, booking.movie || null, booking.seats.join(', '), 'invalid');
      throw new Error('This ticket belongs to a cancelled screening or reservation.');
    }

    if (booking.status === 'checked_in') {
      this.logScan(ticketCode, booking.customerName, booking.movie || null, booking.seats.join(', '), 'duplicate');
      throw new Error(`Ticket already checked in for ${booking.customerName}.`);
    }

    this.db.prepare(`
      UPDATE bookings
      SET status = 'checked_in',
          checked_in_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(booking.id);

    this.logScan(booking.ticketCode || ticketCode, booking.customerName, booking.movie || null, booking.seats.join(', '), 'valid');

    return {
      ticketCode: booking.ticketCode || ticketCode,
      customerName: booking.customerName,
      movie: booking.movie || 'Movie',
      seats: booking.seats,
    };
  }

  getAnalytics(range: 'today' | '7days' | '30days' | 'all' = 'all'): AnalyticsSummary {
    let dateFilter = '';
    if (range === 'today') {
      dateFilter = ` AND b.created_at >= date('now', 'start of day')`;
    } else if (range === '7days') {
      dateFilter = ` AND b.created_at >= datetime('now', '-7 days')`;
    } else if (range === '30days') {
      dateFilter = ` AND b.created_at >= datetime('now', '-30 days')`;
    }

    const sql = `
      SELECT b.id, b.total, b.seats, b.snacks, m.name as movie_name, c.name as cinema_name
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE b.status IN ('confirmed', 'checked_in') ${dateFilter}
    `;

    const rows = this.db.prepare(sql).all() as {
      id: string;
      total: number;
      seats: string;
      snacks: string;
      movie_name: string;
      cinema_name: string;
    }[];

    let grossRevenue = 0;
    let snackRevenue = 0;
    let totalSeatsSold = 0;
    const movieCounts: Record<string, number> = {};
    const cinemaCounts: Record<string, number> = {};

    for (const r of rows) {
      grossRevenue += Number(r.total) || 0;

      // Parse seats
      try {
        const sArr = JSON.parse(r.seats || '[]');
        if (Array.isArray(sArr)) totalSeatsSold += sArr.length;
      } catch {}

      // Parse snacks
      try {
        const snArr = JSON.parse(r.snacks || '[]');
        if (Array.isArray(snArr)) {
          for (const sn of snArr) {
            snackRevenue += (Number(sn.qty) || 0) * (Number(sn.price) || 0);
          }
        }
      } catch {}

      // Counts for top movie and cinema
      if (r.movie_name) {
        movieCounts[r.movie_name] = (movieCounts[r.movie_name] || 0) + 1;
      }
      if (r.cinema_name) {
        cinemaCounts[r.cinema_name] = (cinemaCounts[r.cinema_name] || 0) + 1;
      }
    }

    const ticketRevenue = Math.max(0, Math.round((grossRevenue - snackRevenue) * 100) / 100);

    // Compute top movie and cinema
    let topMovie = 'N/A';
    let maxMovieCount = 0;
    for (const [mName, cnt] of Object.entries(movieCounts)) {
      if (cnt > maxMovieCount) {
        maxMovieCount = cnt;
        topMovie = mName;
      }
    }

    let topCinema = 'N/A';
    let maxCinemaCount = 0;
    for (const [cName, cnt] of Object.entries(cinemaCounts)) {
      if (cnt > maxCinemaCount) {
        maxCinemaCount = cnt;
        topCinema = cName;
      }
    }

    // Compute occupancy rate against scheduled showtimes capacity (standard 80 seats per screen)
    const showtimesCountRow = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM showtimes WHERE status = 'scheduled'
    `).get() as { cnt: number };
    const scheduledShowtimes = showtimesCountRow ? showtimesCountRow.cnt : 1;
    const totalCapacity = Math.max(scheduledShowtimes * 80, totalSeatsSold, 1);
    const occupancyRate = Math.min(100, Math.round((totalSeatsSold / totalCapacity) * 1000) / 10);

    return {
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      ticketRevenue,
      snackRevenue: Math.round(snackRevenue * 100) / 100,
      occupancyRate,
      totalBookings: rows.length,
      totalSeatsSold,
      topMovie,
      topCinema,
    };
  }

  lookupBookings(query: string): Booking[] {
    const q = query.trim();
    if (!q) return [];

    const sql = `
      SELECT b.*,
             m.name as movie_name,
             s.date as show_date,
             s.time as show_time,
             c.name as cinema_name
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE UPPER(b.ticket_code) = UPPER(?) OR LOWER(b.email) = LOWER(?)
      ORDER BY b.created_at DESC
    `;

    const rows = this.db.prepare(sql).all(q, q) as unknown as BookingRow[];
    return rows.map((r) => this.mapRow(r));
  }

  countConfirmed(): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as cnt 
      FROM bookings 
      WHERE status IN ('confirmed', 'checked_in')
    `).get() as { cnt: number };
    return row ? row.cnt : 0;
  }
}
