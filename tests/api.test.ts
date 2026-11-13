import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestContext } from './setup.js';
import { env } from '../src/config/env.js';

describe('MovieHub Comprehensive API Test Suite', () => {
  let app: any;

  beforeEach(() => {
    const ctx = createTestContext();
    app = ctx.app;
  });

  describe('Health Check Endpoint', () => {
    it('returns 200 OK with local SQLite storage mode', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.mode).toBe('local SQLite');
    });
  });

  describe('Admin Authentication Middleware', () => {
    it('rejects unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/admin/summary');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Admin authentication required');
    });

    it('rejects requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('X-Admin-Token', 'wrong-token');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid admin token.');
    });

    it('accepts requests with valid X-Admin-Token', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('X-Admin-Token', env.ADMIN_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.cinemas).toBeGreaterThan(0);
      expect(res.body.movies).toBeGreaterThan(0);
    });
  });

  describe('Cinema Module', () => {
    it('fetches only active cinemas for public endpoint', async () => {
      const res = await request(app).get('/api/cinemas');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((c: any) => c.active === true)).toBe(true);
    });

    it('creates a new cinema when authorized', async () => {
      const newCinema = {
        name: 'Cineplex Odeon',
        city: 'Chandigarh',
        address: 'Sector 17 Plaza',
        mapUrl: 'https://maps.google.com',
        amenities: ['Dolby Atmos', 'Recliners'],
        lateNight: true,
        active: true,
      };

      const res = await request(app)
        .post('/api/admin/cinemas')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send(newCinema);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(newCinema.name);
      expect(res.body.id).toBeDefined();
    });

    it('updates cinema status (deactivate / activate)', async () => {
      const res = await request(app)
        .put('/api/admin/cinemas/1')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ active: false });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });
  });

  describe('Movie Catalog Module', () => {
    it('creates and archives a movie', async () => {
      const newMovie = {
        name: 'Avatar: The Way of Water',
        releaseYear: 2022,
        genre: 'Sci-Fi, Action',
        durationMinutes: 192,
        rating: 7.6,
        languages: ['English', 'Hindi'],
        certificate: 'U/A',
        description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.',
        active: true,
      };

      const createRes = await request(app)
        .post('/api/admin/movies')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send(newMovie);

      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe(newMovie.name);

      const movieId = createRes.body.id;

      // Archive movie
      const archiveRes = await request(app)
        .put(`/api/admin/movies/${movieId}`)
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ active: false });

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.active).toBe(false);
    });
  });

  describe('Screenings & Cancellation Workflow', () => {
    it('creates a screening and allows cancellation with affected bookings cascade', async () => {
      const newShowtime = {
        cinemaId: 1,
        movieId: 1,
        date: '2026-11-20',
        time: '7:30 PM',
        category: 'IMAX Special',
        screen: 'Screen 01',
        startingPrice: 400,
      };

      const createRes = await request(app)
        .post('/api/admin/showtimes')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send(newShowtime);

      expect(createRes.status).toBe(201);
      const showtimeId = createRes.body.id;

      // Create a booking on this screening
      const bookingRes = await request(app).post('/api/bookings').send({
        showtimeId,
        customerName: 'Rohit Verma',
        email: 'rohit@example.com',
        seats: ['A1', 'A2'],
        total: 800,
      });

      expect(bookingRes.status).toBe(201);
      const bookingId = bookingRes.body.id;

      // Cancel the screening
      const cancelRes = await request(app)
        .post(`/api/admin/showtimes/${showtimeId}/cancel`)
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ reason: 'Projector lamp replacement' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.affectedBookings).toBe(1);

      // Verify the booking is now pending resolution
      const checkBooking = await request(app)
        .get(`/api/admin/bookings?showtime_id=${showtimeId}`)
        .set('X-Admin-Token', env.ADMIN_TOKEN);

      expect(checkBooking.body[0].status).toBe('cancelled');
      expect(checkBooking.body[0].resolutionStatus).toBe('pending');

      // Issue a complimentary replacement ticket to another screening
      const replacementRes = await request(app)
        .post(`/api/admin/bookings/${bookingId}/replacement`)
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ showtimeId: 2 });

      expect(replacementRes.status).toBe(200);
      expect(replacementRes.body.ticketCode).toMatch(/^MOVIEHUB-/);
    });
  });

  describe('Staff Ticket Scanner & Validation', () => {
    it('validates and checks in an existing confirmed ticket', async () => {
      const res = await request(app)
        .post('/api/staff/scan')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ ticketCode: 'MOVIEHUB-7K9A-3M' });

      expect(res.status).toBe(200);
      expect(res.body.ticketCode).toBe('MOVIEHUB-7K9A-3M');
      expect(res.body.customerName).toBe('Aarav Sharma');

      // Attempt second check-in should be rejected
      const secondScan = await request(app)
        .post('/api/staff/scan')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ ticketCode: 'MOVIEHUB-7K9A-3M' });

      expect(secondScan.status).toBe(400);
      expect(secondScan.body.error).toContain('already checked in');
    });

    it('rejects invalid non-existent ticket codes', async () => {
      const res = await request(app)
        .post('/api/staff/scan')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ ticketCode: 'MOVIEHUB-INVALID-00' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ticket code');
    });
  });

  describe('Theater Seating & Concurrency Collision Guard', () => {
    it('fetches booked seats and pricing tiers for a showtime', async () => {
      // Showtime 1 is seeded with booked seats F12, F13
      const res = await request(app).get('/api/showtimes/1/seats');
      expect(res.status).toBe(200);
      expect(res.body.showtimeId).toBe(1);
      expect(Array.isArray(res.body.bookedSeats)).toBe(true);
      expect(res.body.bookedSeats).toContain('F12');
      expect(res.body.bookedSeats).toContain('F13');
      expect(res.body.pricingTiers).toBeDefined();
      expect(res.body.pricingTiers.VIP).toBeGreaterThan(0);
    });

    it('prevents double-booking already reserved seats with 409 Conflict', async () => {
      // Attempt to book F12 which is already reserved
      const res = await request(app).post('/api/bookings').send({
        showtimeId: 1,
        customerName: 'Kunal Sen',
        email: 'kunal@example.com',
        seats: ['F12', 'F14'],
        total: 760,
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already booked');
      expect(res.body.occupiedSeats).toContain('F12');
    });
  });

  describe('Ticket Lookup & F&B Concessions Add-on', () => {
    it('creates a booking with F&B snacks included in total', async () => {
      const res = await request(app).post('/api/bookings').send({
        showtimeId: 1,
        customerName: 'Ananya Roy',
        email: 'ananya.roy@example.com',
        seats: ['B5', 'B6'],
        snacks: [
          { id: 'popcorn_caramel', name: 'Caramel Popcorn Tub', qty: 1, price: 240 },
          { id: 'drink_cola', name: 'Chilled Cold Beverage', qty: 2, price: 150 },
        ],
        total: 760 + 240 + 300,
      });

      expect(res.status).toBe(201);
      expect(res.body.ticketCode).toMatch(/^MOVIEHUB-/);
      expect(Array.isArray(res.body.snacks)).toBe(true);
      expect(res.body.snacks.length).toBe(2);
      expect(res.body.snacks[0].name).toBe('Caramel Popcorn Tub');
    });

    it('finds tickets by ticket code', async () => {
      const res = await request(app).get('/api/bookings/lookup?query=MOVIEHUB-7K9A-3M');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].ticketCode).toBe('MOVIEHUB-7K9A-3M');
      expect(res.body[0].customerName).toBe('Aarav Sharma');
    });

    it('finds tickets by customer email address', async () => {
      const res = await request(app).get('/api/bookings/lookup?query=aarav.sharma@example.com');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].email).toBe('aarav.sharma@example.com');
    });
  });

  describe('F&B Concessions Menu API', () => {
    it('fetches in-stock snacks for customers', async () => {
      const res = await request(app).get('/api/snacks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
    });

    it('creates a new snack item via admin API', async () => {
      const res = await request(app)
        .post('/api/admin/snacks')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({
          name: 'Gourmet Truffle Popcorn',
          icon: '🍿',
          price: 290,
          category: 'Popcorn',
          description: 'Aromatic white truffle oil with sea salt',
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Gourmet Truffle Popcorn');
      expect(res.body.price).toBe(290);
    });

    it('toggles in-stock status of a snack', async () => {
      const res = await request(app)
        .patch('/api/admin/snacks/popcorn_caramel/stock')
        .set('X-Admin-Token', env.ADMIN_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.inStock).toBe(false);
    });
  });

  describe('Promo Codes & Discount Engine', () => {
    it('validates a percentage discount promo code', async () => {
      const res = await request(app).post('/api/promos/validate').send({
        code: 'WELCOME20',
        subtotal: 1000,
      });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.discountAmount).toBe(200);
      expect(res.body.discountType).toBe('percentage');
    });

    it('validates a flat discount promo code', async () => {
      const res = await request(app).post('/api/promos/validate').send({
        code: 'FLAT100',
        subtotal: 500,
      });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.discountAmount).toBe(100);
    });

    it('rejects unknown promo code', async () => {
      const res = await request(app).post('/api/promos/validate').send({
        code: 'INVALIDCODE99',
        subtotal: 500,
      });
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
    });

    it('creates a new promo code via admin API', async () => {
      const res = await request(app)
        .post('/api/admin/promos')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({
          code: 'FESTIVE50',
          discountType: 'percentage',
          discountValue: 50,
          maxUses: 50,
        });
      expect(res.status).toBe(201);
      expect(res.body.code).toBe('FESTIVE50');
      expect(res.body.discountValue).toBe(50);
    });
  });

  describe('Revenue Analytics & Audit Scan Logs', () => {
    it('returns financial analytics summary for admin', async () => {
      const res = await request(app)
        .get('/api/admin/analytics?range=all')
        .set('X-Admin-Token', env.ADMIN_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('grossRevenue');
      expect(res.body).toHaveProperty('ticketRevenue');
      expect(res.body).toHaveProperty('snackRevenue');
      expect(res.body).toHaveProperty('occupancyRate');
      expect(res.body).toHaveProperty('topGenre');
      expect(res.body).toHaveProperty('genreBreakdown');
      expect(res.body).toHaveProperty('monthlySales');
      expect(res.body).toHaveProperty('yearlySales');
      expect(Array.isArray(res.body.genreBreakdown)).toBe(true);
      expect(Array.isArray(res.body.monthlySales)).toBe(true);
      expect(Array.isArray(res.body.yearlySales)).toBe(true);
      expect(res.body.grossRevenue).toBeGreaterThan(0);
    });

    it('retrieves recent door check scan logs', async () => {
      const res = await request(app)
        .get('/api/admin/scan-logs')
        .set('X-Admin-Token', env.ADMIN_TOKEN);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('ticketCode');
      expect(res.body[0]).toHaveProperty('status');
    });

    it('logs door scan attempt on check-in', async () => {
      const checkInRes = await request(app)
        .post('/api/staff/scan')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ ticketCode: 'MOVIEHUB-7K9A-3M' });
      expect(checkInRes.status).toBe(200);

      const logsRes = await request(app)
        .get('/api/admin/scan-logs')
        .set('X-Admin-Token', env.ADMIN_TOKEN);
      expect(logsRes.status).toBe(200);
      const latestScan = logsRes.body[0];
      expect(latestScan.ticketCode).toBe('MOVIEHUB-7K9A-3M');
      expect(latestScan.status).toBe('valid');
    });
  });

  describe('Live Hall Occupancy Inspector & Seat Blocking', () => {
    it('inspects hall occupancy with seat details and blocked seats', async () => {
      const res = await request(app)
        .get('/api/admin/showtimes/1/occupancy')
        .set('X-Admin-Token', env.ADMIN_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('showtime');
      expect(res.body).toHaveProperty('seatDetails');
      expect(res.body).toHaveProperty('blockedSeats');
      expect(res.body.seatDetails['F12']).toBeDefined();
    });

    it('allows staff to block and unblock a seat', async () => {
      // 1. Block seat A1
      const blockRes = await request(app)
        .post('/api/admin/showtimes/1/seats/block')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ seatId: 'A1' });
      expect(blockRes.status).toBe(200);
      expect(blockRes.body.action).toBe('blocked');
      expect(blockRes.body.blockedSeats).toContain('A1');

      // 2. Customer booking seat A1 should be rejected as already taken
      const bookRes = await request(app).post('/api/bookings').send({
        showtimeId: 1,
        customerName: 'Blocked Test',
        email: 'blocked@example.com',
        seats: ['A1'],
        total: 380,
      });
      expect(bookRes.status).toBe(409);

      // 3. Unblock seat A1
      const unblockRes = await request(app)
        .post('/api/admin/showtimes/1/seats/block')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ seatId: 'A1' });
      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.action).toBe('unblocked');
      expect(unblockRes.body.blockedSeats).not.toContain('A1');
    });

    it('prevents staff from blocking a seat that is already booked by a customer', async () => {
      const res = await request(app)
        .post('/api/admin/showtimes/1/seats/block')
        .set('X-Admin-Token', env.ADMIN_TOKEN)
        .send({ seatId: 'F12' }); // F12 is booked by Aarav Sharma
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already booked');
    });
  });
});
