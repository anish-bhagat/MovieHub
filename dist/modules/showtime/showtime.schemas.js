"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelShowtimeSchema = exports.updateShowtimeSchema = exports.createShowtimeSchema = void 0;
const zod_1 = require("zod");
exports.createShowtimeSchema = zod_1.z.object({
    cinemaId: zod_1.z.coerce.number().int().positive('Valid cinemaId is required'),
    movieId: zod_1.z.coerce.number().int().positive('Valid movieId is required'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    time: zod_1.z.string().min(1, 'Screening time is required'),
    category: zod_1.z.string().min(1).max(40).default('Regular'),
    screen: zod_1.z.string().min(1).max(30).default('Screen 01'),
    startingPrice: zod_1.z.coerce.number().min(0).max(100000).default(150),
});
exports.updateShowtimeSchema = exports.createShowtimeSchema.partial();
exports.cancelShowtimeSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Reason for cancellation is required').max(500),
});
//# sourceMappingURL=showtime.schemas.js.map