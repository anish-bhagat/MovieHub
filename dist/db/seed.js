"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const node_crypto_1 = __importDefault(require("node:crypto"));
const connection_js_1 = require("./connection.js");
const cinema_repository_js_1 = require("./repositories/cinema.repository.js");
const movie_repository_js_1 = require("./repositories/movie.repository.js");
const showtime_repository_js_1 = require("./repositories/showtime.repository.js");
const booking_repository_js_1 = require("./repositories/booking.repository.js");
function seedDatabase(customDb) {
    const db = customDb || (0, connection_js_1.getDb)();
    console.log('🌱 Seeding database...');
    const cinemaRepo = new cinema_repository_js_1.CinemaRepository(db);
    const movieRepo = new movie_repository_js_1.MovieRepository(db);
    const showtimeRepo = new showtime_repository_js_1.ShowtimeRepository(db);
    const bookingRepo = new booking_repository_js_1.BookingRepository(db);
    // Clear existing data for clean seed
    db.exec(`
    DELETE FROM scan_logs;
    DELETE FROM promos;
    DELETE FROM snacks;
    DELETE FROM bookings;
    DELETE FROM showtimes;
    DELETE FROM movies;
    DELETE FROM cinemas;
  `);
    // 1. Seed Cinemas
    const c1 = cinemaRepo.create({
        name: 'PVR Select Citywalk IMAX',
        city: 'New Delhi',
        address: 'A-3, District Centre, Saket',
        mapUrl: 'https://maps.google.com/?q=PVR+Saket',
        amenities: ['IMAX Laser', 'Dolby Atmos', 'Recliner Loungers', 'Gourmet Dining'],
        lateNight: true,
        active: true,
    });
    const c2 = cinemaRepo.create({
        name: 'INOX Megaplex Inorbit',
        city: 'Mumbai',
        address: 'Inorbit Mall, Malad West',
        mapUrl: 'https://maps.google.com/?q=INOX+Malad',
        amenities: ['Insignia 7-Star', 'Onyx LED', 'Dolby Atmos', 'Valet Parking'],
        lateNight: true,
        active: true,
    });
    const c3 = cinemaRepo.create({
        name: 'Cinepolis Grand Venice 4DX',
        city: 'Greater Noida',
        address: 'Grand Venice Mall, Kasna Road',
        mapUrl: 'https://maps.google.com/?q=Cinepolis+Grand+Venice',
        amenities: ['4DX Dynamic Seats', 'RealD 3D', 'VIP Lounge'],
        lateNight: false,
        active: true,
    });
    const c4 = cinemaRepo.create({
        name: 'PVR Directors Cut',
        city: 'Bengaluru',
        address: 'Forum Rex Walk, Brigade Road',
        mapUrl: 'https://maps.google.com/?q=PVR+Directors+Cut+Bangalore',
        amenities: ['Ultra Luxury Loungers', 'Chef On Call', 'Dolby 7.1'],
        lateNight: true,
        active: false, // inactive demonstration
    });
    // 2. Seed Movies
    const m1 = movieRepo.create({
        name: 'Interstellar',
        releaseYear: 2014,
        genre: 'Sci-Fi, Adventure, Drama',
        durationMinutes: 169,
        rating: 8.7,
        languages: ['English', 'Hindi'],
        certificate: 'U/A',
        posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
        art: 'art-blue',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        active: true,
    });
    const m2 = movieRepo.create({
        name: 'Dune: Part Two',
        releaseYear: 2024,
        genre: 'Action, Adventure, Sci-Fi',
        durationMinutes: 166,
        rating: 8.5,
        languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
        certificate: 'U/A',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        art: 'art-ember',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        active: true,
    });
    const m3 = movieRepo.create({
        name: 'Oppenheimer',
        releaseYear: 2023,
        genre: 'Biography, Drama, History',
        durationMinutes: 180,
        rating: 8.9,
        languages: ['English', 'Hindi'],
        certificate: 'A',
        posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
        art: 'art-gold',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        active: true,
    });
    const m4 = movieRepo.create({
        name: 'Spirited Away',
        releaseYear: 2001,
        genre: 'Animation, Adventure, Family',
        durationMinutes: 125,
        rating: 8.6,
        languages: ['Japanese', 'English'],
        certificate: 'U',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        art: 'art-violet',
        description: 'During her family’s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',
        active: true,
    });
    // 3. Seed Showtimes
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];
    const s1 = showtimeRepo.create({
        cinemaId: c1.id,
        movieId: m1.id,
        date: today,
        time: '1:30 PM',
        category: 'IMAX Laser 2D',
        screen: 'Screen 01 (IMAX)',
        startingPrice: 380,
    });
    const s2 = showtimeRepo.create({
        cinemaId: c1.id,
        movieId: m2.id,
        date: today,
        time: '5:00 PM',
        category: 'IMAX Laser 2D',
        screen: 'Screen 01 (IMAX)',
        startingPrice: 450,
    });
    const s3 = showtimeRepo.create({
        cinemaId: c1.id,
        movieId: m1.id,
        date: today,
        time: '11:30 PM',
        category: 'Late Night Special',
        screen: 'Screen 01 (IMAX)',
        startingPrice: 320,
    });
    const s4 = showtimeRepo.create({
        cinemaId: c2.id,
        movieId: m3.id,
        date: today,
        time: '9:00 PM',
        category: 'Insignia Luxury',
        screen: 'Insignia Audi 2',
        startingPrice: 550,
    });
    const s5 = showtimeRepo.create({
        cinemaId: c1.id,
        movieId: m2.id,
        date: tomorrow,
        time: '10:00 AM',
        category: 'Morning Saver',
        screen: 'Screen 01 (IMAX)',
        startingPrice: 250,
    });
    const s6 = showtimeRepo.create({
        cinemaId: c3.id,
        movieId: m4.id,
        date: tomorrow,
        time: '1:30 PM',
        category: 'Classic Matinee',
        screen: 'Audi 4',
        startingPrice: 180,
    });
    // 4. Seed Bookings (Current & Historical for Reports & Trend Analytics)
    const bookingStmt = db.prepare(`
    INSERT INTO bookings (id, ticket_code, showtime_id, customer_name, email, seats, total, status, payment_status, payment_method, resolution_status, created_at, checked_in_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    // Current month bookings
    const b1Id = node_crypto_1.default.randomUUID();
    const b1Ticket = 'MOVIEHUB-7K9A-3M';
    bookingStmt.run(b1Id, b1Ticket, s1.id, 'Aarav Sharma', 'aarav.sharma@example.com', JSON.stringify(['F12', 'F13']), 760, 'confirmed', 'demo_paid', 'Simulated UPI', 'none', new Date().toISOString(), null);
    const b2Id = node_crypto_1.default.randomUUID();
    const b2Ticket = 'MOVIEHUB-4B1C-8X';
    bookingStmt.run(b2Id, b2Ticket, s2.id, 'Priya Patel', 'priya.patel@example.com', JSON.stringify(['G10', 'G11']), 900, 'checked_in', 'paid', 'Credit Card', 'none', new Date().toISOString(), new Date(Date.now() - 1800000).toISOString());
    const b3Id = node_crypto_1.default.randomUUID();
    const b3Ticket = 'MOVIEHUB-9Z4D-2W';
    bookingStmt.run(b3Id, b3Ticket, s4.id, 'Vikramaditya Roy', 'vikram.roy@example.com', JSON.stringify(['VIP-A1', 'VIP-A2', 'VIP-A3']), 1650, 'confirmed', 'demo_paid', 'Net Banking', 'none', new Date().toISOString(), null);
    // Historical bookings for Monthly and Yearly analytics
    const historical = [
        { name: 'Rohan Mehra', email: 'rohan.m@example.com', st: s2.id, seats: ['C1', 'C2', 'C3', 'C4'], total: 1800, date: '2025-06-12 18:30:00' },
        { name: 'Ananya Verma', email: 'ananya.v@example.com', st: s1.id, seats: ['D5', 'D6'], total: 950, date: '2025-09-20 20:00:00' },
        { name: 'Kavita Singh', email: 'kavita.s@example.com', st: s4.id, seats: ['E1', 'E2'], total: 1100, date: '2025-11-05 17:15:00' },
        { name: 'Siddharth Nair', email: 'sid.n@example.com', st: s6.id, seats: ['F1', 'F2', 'F3'], total: 1050, date: '2025-12-25 15:00:00' },
        { name: 'Neha Gupta', email: 'neha.g@example.com', st: s2.id, seats: ['B4', 'B5', 'B6'], total: 1350, date: '2026-01-18 19:45:00' },
        { name: 'Rahul Joshi', email: 'rahul.j@example.com', st: s1.id, seats: ['H1', 'H2', 'H3', 'H4'], total: 1900, date: '2026-03-22 21:30:00' },
        { name: 'Tanvi Deshmukh', email: 'tanvi.d@example.com', st: s6.id, seats: ['A1', 'A2'], total: 700, date: '2026-06-10 14:00:00' },
        { name: 'Aditya Kulkarni', email: 'aditya.k@example.com', st: s2.id, seats: ['E7', 'E8', 'E9'], total: 1450, date: '2026-08-14 18:00:00' },
        { name: 'Zoya Khan', email: 'zoya.k@example.com', st: s4.id, seats: ['VIP-B1', 'VIP-B2'], total: 1200, date: '2026-10-02 20:30:00' },
    ];
    for (let i = 0; i < historical.length; i++) {
        const h = historical[i];
        const code = `MOVIEHUB-HIST-${i + 10}X`;
        bookingStmt.run(node_crypto_1.default.randomUUID(), code, h.st, h.name, h.email, JSON.stringify(h.seats), h.total, 'confirmed', 'paid', 'Credit Card', 'none', h.date, null);
    }
    // 5. Seed Snacks
    const snackStmt = db.prepare(`
    INSERT INTO snacks (id, name, icon, price, in_stock, category, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    snackStmt.run('popcorn_caramel', 'Caramel Popcorn (Jumbo)', '🍿', 240, 1, 'Popcorn', 'Crunchy artisan caramel glazed corn');
    snackStmt.run('popcorn_salted', 'Classic Salted Butter Popcorn', '🍿', 190, 1, 'Popcorn', 'Warm freshly popped cinema salted butter corn');
    snackStmt.run('nachos_cheese', 'Loaded Nachos & Jalapeño Cheese', '🧀', 220, 1, 'Snacks', 'Crispy corn tortilla chips with warm cheddar dip');
    snackStmt.run('fountain_pepsi', 'Chilled Fountain Pepsi (500ml)', '🥤', 120, 1, 'Beverages', 'Ice-cold carbonated beverage');
    snackStmt.run('cold_brew', 'Iced Cold Brew Coffee', '☕', 160, 1, 'Beverages', 'Smooth double-steeped chilled coffee');
    snackStmt.run('combo_duo', 'Duo Cinema Combo', '🎟️', 399, 1, 'Combos', '1 Jumbo Popcorn + 2 Fountain Sodas');
    // 6. Seed Promos
    const promoStmt = db.prepare(`
    INSERT INTO promos (id, code, discount_type, discount_value, max_uses, used_count, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    promoStmt.run(node_crypto_1.default.randomUUID(), 'WELCOME20', 'percentage', 20, 500, 12, 1);
    promoStmt.run(node_crypto_1.default.randomUUID(), 'FLAT100', 'flat', 100, 200, 4, 1);
    promoStmt.run(node_crypto_1.default.randomUUID(), 'SUPERMOVIE', 'percentage', 15, 100, 0, 1);
    // 7. Seed Initial Scan Logs
    const scanStmt = db.prepare(`
    INSERT INTO scan_logs (ticket_code, customer_name, movie, seats, status, timestamp)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-25 minutes'))
  `);
    scanStmt.run(b2Ticket, 'Priya Patel', 'Dune: Part Two', 'G10, G11', 'valid');
    console.log('✅ Database seeded successfully with cinemas, movies, showtimes, snacks, promos, and bookings!');
}
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
    seedDatabase();
}
//# sourceMappingURL=seed.js.map