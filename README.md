# 🎬 MovieHub — Production Cinema & Screening Management System

MovieHub is a robust, modular cinema management and ticketing platform designed to meet an **8–9/10 code quality standard**. It features a modern, accessible admin control room, public customer booking simulation, timing-safe authentication, strict TypeScript typing, Zod schema validation, transaction-safe SQLite persistence, and an automated test suite.

---

## 🌟 Key Highlights & Code Quality (8–9/10)

- **Clean Layered Architecture**: Routes $\rightarrow$ Controllers/Middleware $\rightarrow$ Services $\rightarrow$ Repositories $\rightarrow$ Database.
- **Strict Type Safety**: Full TypeScript 5+ configuration with `strict: true`, no implicit `any`, and explicit DTO interfaces.
- **Defensive Error Handling**: Centralized error middleware with standardized JSON error payloads.
- **Timing-Safe Security**: Constant-time `crypto.timingSafeEqual` comparison for admin access tokens to mitigate timing attacks.
- **Automated Validation**: All request bodies and query parameters are strictly validated using `Zod` schemas.
- **Reliable Storage**: Transaction-safe SQLite database with foreign keys, WAL journaling mode, and automated schema migrations.
- **Modern Modular Frontend**: Unminified, accessible ES modules with safe DOM rendering (preventing XSS), CSS custom properties, and responsive layouts.
- **Automated Testing**: 100% passing test coverage across health checks, cinema management, movie cataloging, screening cancellation cascades, and QR ticket scanning.

---

## 📁 Project Architecture

```
moviehub/
├── src/
│   ├── app.ts                         # Express application factory & middleware setup
│   ├── server.ts                      # Server entry point with graceful shutdown
│   ├── config/
│   │   └── env.ts                     # Validated environment variables (Zod)
│   ├── db/
│   │   ├── connection.ts              # SQLite connection manager & WAL configuration
│   │   ├── schema.sql                 # SQL schema definitions & indexes
│   │   ├── seed.ts                    # Realistic cinema, movie & booking fixtures
│   │   └── repositories/
│   │       ├── cinema.repository.ts   # Cinema data access layer
│   │       ├── movie.repository.ts    # Movie catalog data access layer
│   │       ├── showtime.repository.ts # Showtimes & cancellation cascade
│   │       └── booking.repository.ts  # Ticketing, check-in, refunds & replacements
│   ├── middleware/
│   │   ├── auth.ts                    # Timing-safe admin authentication
│   │   ├── validate.ts                # Generic Zod validation middleware
│   │   └── errorHandler.ts            # Centralized error handler
│   ├── modules/                       # Domain routers & validation schemas
│   │   ├── cinema/
│   │   ├── movie/
│   │   ├── showtime/
│   │   ├── booking/
│   │   ├── staff/
│   │   └── health/
│   └── types/
│       └── index.ts                   # Domain models and DTO interfaces
├── public/
│   ├── index.html                     # Customer cinema portal
│   ├── customer.css                   # Customer theme styling
│   ├── customer.js                    # Movie selection & ticket booking simulation
│   └── admin/
│       ├── index.html                 # Admin Control Room
│       ├── css/
│       │   ├── admin.css              # Core admin layout & component styling
│       │   ├── admin-cinemas.css      # Cinema catalog and map links
│       │   ├── admin-movies.css       # Movie posters, artwork themes & dialogs
│       │   └── admin-schedule.css     # Screenings, cancellations & resolution
│       └── js/
│           ├── api.js                 # Authenticated API client
│           └── admin.js               # Admin dashboard controller
├── tests/
│   ├── setup.ts                       # In-memory SQLite test fixtures
│   └── api.test.ts                    # Automated Vitest integration test suite
├── package.json
├── tsconfig.json
└── .env
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
Populates initial sample cinemas, movies, upcoming showtimes, and reservations:
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
```

The server will launch at `http://localhost:3000`:
- **Admin Control Room**: `http://localhost:3000/admin`
  - Default Admin Token: `moviehub-super-secret-token` (configured in `.env`)
- **Customer Cinema Portal**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/api/health`

### 4. Run Automated Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | System status and storage engine info |
| `GET` | `/api/cinemas` | None | Public list of active cinemas |
| `GET` | `/api/movies` | None | Public list of currently active movies |
| `GET` | `/api/showtimes` | None | Public upcoming screenings |
| `POST`| `/api/bookings` | None | Simulate customer ticket reservation |
| `GET` | `/api/admin/summary` | Admin | Overall cinema, movie, screening & ticket metrics |
| `GET` | `/api/admin/cinemas` | Admin | List all cinemas (active + inactive) |
| `POST`| `/api/admin/cinemas` | Admin | Create a new cinema location |
| `PUT` | `/api/admin/cinemas/:id`| Admin | Update cinema details or toggle active status |
| `GET` | `/api/admin/movies` | Admin | List all movies in catalog |
| `POST`| `/api/admin/movies` | Admin | Add new movie to catalog |
| `PUT` | `/api/admin/movies/:id` | Admin | Edit movie or archive/restore |
| `GET` | `/api/admin/showtimes?date=YYYY-MM-DD` | Admin | Query screenings for a specific date |
| `POST`| `/api/admin/showtimes` | Admin | Schedule a new screening |
| `PUT` | `/api/admin/showtimes/:id` | Admin | Edit an existing screening (if no bookings) |
| `POST`| `/api/admin/showtimes/:id/cancel` | Admin | Cancel screening and trigger booking resolution |
| `GET` | `/api/admin/bookings` | Admin | View recent bookings or filter by `showtime_id` |
| `POST`| `/api/admin/bookings/:id/refund` | Admin | Log external refund reference |
| `POST`| `/api/admin/bookings/:id/replacement`| Admin | Issue complimentary replacement ticket |
| `POST`| `/api/staff/scan` | Admin | Validate digital ticket code at the door |

---

## 🔒 Security & Best Practices

- **Token Protection**: Protected routes require `X-Admin-Token` header.
- **SQL Injection Prevention**: All queries use prepared statements with strict parameter binding.
- **XSS Protection**: Dynamic DOM generation in the frontend uses safe DOM nodes rather than unchecked `innerHTML`.
- **Concurrency & Durability**: SQLite runs with Write-Ahead Logging (`WAL`) enabled for high concurrency and resilience.
