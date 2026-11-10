import { DatabaseSync } from 'node:sqlite';
import { Showtime, CreateShowtimeDTO, UpdateShowtimeDTO } from '../../types/index.js';

interface ShowtimeRow {
  id: number;
  cinema_id: number;
  movie_id: number;
  date: string;
  time: string;
  category: string;
  screen: string;
  starting_price: number;
  status: 'scheduled' | 'cancelled';
  cancel_reason: string | null;
  blocked_seats?: string;
  booking_count: number;
  cinema_name: string;
  cinema_city: string;
  cinema_active: number;
  movie_name: string;
  movie_active: number;
  created_at: string;
  updated_at: string;
}

export class ShowtimeRepository {
  constructor(private db: DatabaseSync) {}

  private mapRow(row: ShowtimeRow): Showtime {
    let blockedSeats: string[] = [];
    try {
      blockedSeats = JSON.parse(row.blocked_seats || '[]');
    } catch {
      blockedSeats = [];
    }

    return {
      id: row.id,
      cinemaId: row.cinema_id,
      movieId: row.movie_id,
      date: row.date,
      time: row.time,
      category: row.category,
      screen: row.screen,
      startingPrice: row.starting_price,
      status: row.status,
      cancelReason: row.cancel_reason,
      blockedSeats,
      bookingCount: row.booking_count || 0,
      cinema: row.cinema_name,
      city: row.cinema_city,
      movie: row.movie_name,
      cinemaActive: Boolean(row.cinema_active),
      movieActive: Boolean(row.movie_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  findByDate(date?: string): Showtime[] {
    let query = `
      SELECT s.*, 
             c.name as cinema_name, c.city as cinema_city, c.active as cinema_active,
             m.name as movie_name, m.active as movie_active,
             (SELECT COUNT(*) FROM bookings b WHERE b.showtime_id = s.id) as booking_count
      FROM showtimes s
      JOIN cinemas c ON s.cinema_id = c.id
      JOIN movies m ON s.movie_id = m.id
    `;

    const params: (string | number)[] = [];
    if (date) {
      query += ` WHERE s.date = ?`;
      params.push(date);
    }

    query += ` ORDER BY s.date ASC, s.time ASC`;

    const rows = this.db.prepare(query).all(...params) as unknown as ShowtimeRow[];
    return rows.map((r) => this.mapRow(r));
  }

  findById(id: number): Showtime | null {
    const query = `
      SELECT s.*, 
             c.name as cinema_name, c.city as cinema_city, c.active as cinema_active,
             m.name as movie_name, m.active as movie_active,
             (SELECT COUNT(*) FROM bookings b WHERE b.showtime_id = s.id) as booking_count
      FROM showtimes s
      JOIN cinemas c ON s.cinema_id = c.id
      JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ?
    `;

    const row = this.db.prepare(query).get(id) as unknown as ShowtimeRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  create(data: CreateShowtimeDTO): Showtime {
    const stmt = this.db.prepare(`
      INSERT INTO showtimes (cinema_id, movie_id, date, time, category, screen, starting_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `);

    const result = stmt.run(
      data.cinemaId,
      data.movieId,
      data.date,
      data.time,
      data.category,
      data.screen,
      data.startingPrice
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.findById(insertedId);
    if (!created) throw new Error('Failed to retrieve newly created showtime');
    return created;
  }

  update(id: number, data: UpdateShowtimeDTO): Showtime | null {
    const existing = this.findById(id);
    if (!existing) return null;

    if (existing.bookingCount && existing.bookingCount > 0) {
      throw new Error('Screenings with existing bookings cannot be edited.');
    }

    const cinemaId = data.cinemaId !== undefined ? data.cinemaId : existing.cinemaId;
    const movieId = data.movieId !== undefined ? data.movieId : existing.movieId;
    const date = data.date !== undefined ? data.date : existing.date;
    const time = data.time !== undefined ? data.time : existing.time;
    const category = data.category !== undefined ? data.category : existing.category;
    const screen = data.screen !== undefined ? data.screen : existing.screen;
    const startingPrice = data.startingPrice !== undefined ? data.startingPrice : existing.startingPrice;

    this.db.prepare(`
      UPDATE showtimes
      SET cinema_id = ?, movie_id = ?, date = ?, time = ?, category = ?, screen = ?, starting_price = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(cinemaId, movieId, date, time, category, screen, startingPrice, id);

    return this.findById(id);
  }

  cancel(id: number, reason: string): { affectedBookings: number } {
    const showtime = this.findById(id);
    if (!showtime) throw new Error('Screening not found');

    // Begin transaction
    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.prepare(`
        UPDATE showtimes
        SET status = 'cancelled', cancel_reason = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(reason, id);

      // Invalidate customer tickets and set resolution status
      // For paid tickets, resolution is pending refund or replacement
      const updatePaid = this.db.prepare(`
        UPDATE bookings
        SET status = 'cancelled',
            resolution_status = CASE 
              WHEN total > 0 AND (payment_status = 'demo_paid' OR payment_status = 'paid') THEN 'pending'
              ELSE 'no_payment'
            END,
            updated_at = datetime('now')
        WHERE showtime_id = ?
      `).run(id);

      this.db.exec('COMMIT;');
      return { affectedBookings: Number(updatePaid.changes) };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  countUpcoming(): number {
    const today = new Date().toISOString().split('T')[0];
    const row = this.db.prepare(`
      SELECT COUNT(*) as cnt 
      FROM showtimes 
      WHERE status = 'scheduled' AND date >= ?
    `).get(today) as { cnt: number };
    return row ? row.cnt : 0;
  }

  getBookedSeats(showtimeId: number): string[] {
    const rows = this.db.prepare(`
      SELECT seats FROM bookings 
      WHERE showtime_id = ? AND status IN ('confirmed', 'checked_in')
    `).all(showtimeId) as { seats: string }[];

    const booked = new Set<string>();
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.seats || '[]');
        if (Array.isArray(parsed)) {
          for (const s of parsed) {
            booked.add(String(s).toUpperCase());
          }
        }
      } catch {
        // ignore parse error
      }
    }

    const showtime = this.findById(showtimeId);
    if (showtime && showtime.blockedSeats) {
      for (const s of showtime.blockedSeats) {
        booked.add(String(s).toUpperCase());
      }
    }

    return Array.from(booked);
  }

  toggleSeatBlock(showtimeId: number, rawSeatId: string): { blockedSeats: string[]; action: 'blocked' | 'unblocked' } {
    const seatId = rawSeatId.trim().toUpperCase();
    const showtime = this.findById(showtimeId);
    if (!showtime) throw new Error('Screening not found');

    const bookingRows = this.db.prepare(`
      SELECT seats FROM bookings 
      WHERE showtime_id = ? AND status IN ('confirmed', 'checked_in')
    `).all(showtimeId) as { seats: string }[];

    for (const r of bookingRows) {
      try {
        const parsed = JSON.parse(r.seats || '[]');
        if (Array.isArray(parsed) && parsed.map(s => String(s).toUpperCase()).includes(seatId)) {
          throw new Error(`Cannot block seat ${seatId} because it is already booked by a customer.`);
        }
      } catch (err: any) {
        if (err.message.includes('Cannot block seat')) throw err;
      }
    }

    let currentBlocked = showtime.blockedSeats ? [...showtime.blockedSeats] : [];
    let action: 'blocked' | 'unblocked' = 'blocked';

    if (currentBlocked.includes(seatId)) {
      currentBlocked = currentBlocked.filter((s) => s !== seatId);
      action = 'unblocked';
    } else {
      currentBlocked.push(seatId);
      action = 'blocked';
    }

    this.db.prepare(`
      UPDATE showtimes
      SET blocked_seats = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(currentBlocked), showtimeId);

    return { blockedSeats: currentBlocked, action };
  }

  getHallOccupancy(showtimeId: number) {
    const showtime = this.findById(showtimeId);
    if (!showtime) throw new Error('Screening not found');

    const bookings = this.db.prepare(`
      SELECT ticket_code, customer_name, seats, status, checked_in_at
      FROM bookings
      WHERE showtime_id = ? AND status IN ('confirmed', 'checked_in')
    `).all(showtimeId) as { ticket_code: string; customer_name: string; seats: string; status: string; checked_in_at: string | null }[];

    const seatDetails: Record<string, { status: 'checked_in' | 'confirmed'; customerName: string; ticketCode: string }> = {};

    for (const b of bookings) {
      try {
        const seatList = JSON.parse(b.seats || '[]');
        if (Array.isArray(seatList)) {
          for (const s of seatList) {
            seatDetails[String(s).toUpperCase()] = {
              status: b.status as 'checked_in' | 'confirmed',
              customerName: b.customer_name,
              ticketCode: b.ticket_code,
            };
          }
        }
      } catch {}
    }

    return {
      showtime,
      seatDetails,
      blockedSeats: showtime.blockedSeats || [],
    };
  }
}
