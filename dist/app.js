"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const node_path_1 = __importDefault(require("node:path"));
const cinema_repository_js_1 = require("./db/repositories/cinema.repository.js");
const movie_repository_js_1 = require("./db/repositories/movie.repository.js");
const showtime_repository_js_1 = require("./db/repositories/showtime.repository.js");
const booking_repository_js_1 = require("./db/repositories/booking.repository.js");
const snack_repository_js_1 = require("./db/repositories/snack.repository.js");
const promo_repository_js_1 = require("./db/repositories/promo.repository.js");
const cinema_router_js_1 = require("./modules/cinema/cinema.router.js");
const movie_router_js_1 = require("./modules/movie/movie.router.js");
const showtime_router_js_1 = require("./modules/showtime/showtime.router.js");
const booking_router_js_1 = require("./modules/booking/booking.router.js");
const staff_router_js_1 = require("./modules/staff/staff.router.js");
const health_router_js_1 = require("./modules/health/health.router.js");
const snack_router_js_1 = require("./modules/snack/snack.router.js");
const promo_router_js_1 = require("./modules/promo/promo.router.js");
const analytics_router_js_1 = require("./modules/admin/analytics.router.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
function createApp(db) {
    const app = (0, express_1.default)();
    // Security headers configured to allow fonts and camera/video if needed
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allows inline fonts and camera streams in admin panel
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Repositories
    const cinemaRepo = new cinema_repository_js_1.CinemaRepository(db);
    const movieRepo = new movie_repository_js_1.MovieRepository(db);
    const showtimeRepo = new showtime_repository_js_1.ShowtimeRepository(db);
    const bookingRepo = new booking_repository_js_1.BookingRepository(db);
    const snackRepo = new snack_repository_js_1.SnackRepository(db);
    const promoRepo = new promo_repository_js_1.PromoRepository(db);
    // Mount API Routers
    app.use((0, health_router_js_1.createHealthRouter)());
    app.use((0, cinema_router_js_1.createCinemaRouter)(cinemaRepo));
    app.use((0, movie_router_js_1.createMovieRouter)(movieRepo));
    app.use((0, showtime_router_js_1.createShowtimeRouter)(showtimeRepo));
    app.use((0, booking_router_js_1.createBookingRouter)(bookingRepo, cinemaRepo, movieRepo, showtimeRepo));
    app.use((0, staff_router_js_1.createStaffRouter)(bookingRepo));
    app.use((0, snack_router_js_1.createSnackRouter)(snackRepo));
    app.use((0, promo_router_js_1.createPromoRouter)(promoRepo));
    app.use((0, analytics_router_js_1.createAnalyticsRouter)(bookingRepo, showtimeRepo));
    // Serve static files from public directory
    const publicDir = node_path_1.default.resolve(process.cwd(), 'public');
    app.use(express_1.default.static(publicDir));
    // Serve admin page explicitly on /admin
    app.get('/admin', (_req, res) => {
        res.sendFile(node_path_1.default.join(publicDir, 'admin', 'index.html'));
    });
    // Centralized Error Handling
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map