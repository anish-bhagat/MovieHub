"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCinemaSchema = exports.createCinemaSchema = void 0;
const zod_1 = require("zod");
exports.createCinemaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Cinema name is required').max(120),
    city: zod_1.z.string().min(1, 'City is required').max(80),
    address: zod_1.z.string().min(1, 'Street address is required').max(240),
    mapUrl: zod_1.z.string().max(1200).optional().nullable(),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    lateNight: zod_1.z.boolean().default(false),
    active: zod_1.z.boolean().default(true),
});
exports.updateCinemaSchema = exports.createCinemaSchema.partial();
//# sourceMappingURL=cinema.schemas.js.map