-- MovieHub SQLite Database Schema

CREATE TABLE IF NOT EXISTS cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    map_url TEXT,
    amenities TEXT NOT NULL DEFAULT '[]',
    late_night INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    release_year INTEGER NOT NULL,
    genre TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    rating REAL NOT NULL,
    languages TEXT NOT NULL DEFAULT '[]',
    certificate TEXT NOT NULL DEFAULT 'U/A',
    poster_url TEXT,
    art TEXT NOT NULL DEFAULT 'art-ember',
    description TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Regular',
    screen TEXT NOT NULL DEFAULT 'Screen 01',
    starting_price REAL NOT NULL DEFAULT 150.0,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'cancelled'
    cancel_reason TEXT,
    blocked_seats TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_showtimes_date ON showtimes(date);
CREATE INDEX IF NOT EXISTS idx_showtimes_cinema ON showtimes(cinema_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON showtimes(movie_id);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    ticket_code TEXT UNIQUE,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    seats TEXT NOT NULL DEFAULT '[]',
    snacks TEXT NOT NULL DEFAULT '[]',
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'cancelled' | 'checked_in'
    payment_status TEXT NOT NULL DEFAULT 'demo_paid', -- 'demo_paid' | 'paid' | 'comped' | 'cancelled'
    payment_method TEXT NOT NULL DEFAULT 'Simulated UPI',
    resolution_status TEXT NOT NULL DEFAULT 'none', -- 'none' | 'pending' | 'no_payment' | 'demo_refund_recorded' | 'refund_recorded' | 'replacement_issued'
    refund_amount REAL NOT NULL DEFAULT 0.0,
    refund_reference TEXT,
    replacement_ticket_code TEXT,
    checked_in_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_code ON bookings(ticket_code);

CREATE TABLE IF NOT EXISTS snacks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🍿',
    price REAL NOT NULL,
    in_stock INTEGER NOT NULL DEFAULT 1,
    category TEXT NOT NULL DEFAULT 'Snacks',
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promos (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'flat'
    discount_value REAL NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 100,
    used_count INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_code TEXT NOT NULL,
    customer_name TEXT,
    movie TEXT,
    seats TEXT,
    status TEXT NOT NULL, -- 'valid' | 'duplicate' | 'invalid'
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
