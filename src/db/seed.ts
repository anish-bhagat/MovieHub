import crypto from 'node:crypto';
import { getDb } from './connection.js';
import { CinemaRepository } from './repositories/cinema.repository.js';
import { MovieRepository } from './repositories/movie.repository.js';
import { ShowtimeRepository } from './repositories/showtime.repository.js';
import { BookingRepository } from './repositories/booking.repository.js';

export function seedDatabase(customDb?: any) {
  const db = customDb || getDb();
  console.log('🌱 Seeding database...');

  const cinemaRepo = new CinemaRepository(db);
  const movieRepo = new MovieRepository(db);
  const showtimeRepo = new ShowtimeRepository(db);
  const bookingRepo = new BookingRepository(db);

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

  // 4. Seed Bookings
  const b1Id = crypto.randomUUID();
  const b1Ticket = 'MOVIEHUB-7K9A-3M';
  db.prepare(`
    INSERT INTO bookings (id, ticket_code, showtime_id, customer_name, email, seats, total, status, payment_status, payment_method, resolution_status)
    VALUES (?, ?, ?, 'Aarav Sharma', 'aarav.sharma@example.com', ?, 760, 'confirmed', 'demo_paid', 'Simulated UPI', 'none')
  `).run(b1Id, b1Ticket, s1.id, JSON.stringify(['F12', 'F13']));

  const b2Id = crypto.randomUUID();
  const b2Ticket = 'MOVIEHUB-4B1C-8X';
  db.prepare(`
    INSERT INTO bookings (id, ticket_code, showtime_id, customer_name, email, seats, total, status, payment_status, payment_method, resolution_status, checked_in_at)
    VALUES (?, ?, ?, 'Priya Patel', 'priya.patel@example.com', ?, 900, 'checked_in', 'paid', 'Credit Card', 'none', datetime('now', '-30 minutes'))
  `).run(b2Id, b2Ticket, s2.id, JSON.stringify(['G10', 'G11']));

  const b3Id = crypto.randomUUID();
  const b3Ticket = 'MOVIEHUB-9Z4D-2W';
  db.prepare(`
    INSERT INTO bookings (id, ticket_code, showtime_id, customer_name, email, seats, total, status, payment_status, payment_method, resolution_status)
    VALUES (?, ?, ?, 'Vikramaditya Roy', 'vikram.roy@example.com', ?, 1100, 'confirmed', 'demo_paid', 'Net Banking', 'none')
  `).run(b3Id, b3Ticket, s4.id, JSON.stringify(['VIP-A1', 'VIP-A2']));

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
  promoStmt.run(crypto.randomUUID(), 'WELCOME20', 'percentage', 20, 500, 12, 1);
  promoStmt.run(crypto.randomUUID(), 'FLAT100', 'flat', 100, 200, 4, 1);
  promoStmt.run(crypto.randomUUID(), 'SUPERMOVIE', 'percentage', 15, 100, 0, 1);

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

