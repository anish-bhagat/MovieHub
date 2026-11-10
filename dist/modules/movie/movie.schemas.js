"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMovieSchema = exports.createMovieSchema = void 0;
const zod_1 = require("zod");
exports.createMovieSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Movie name is required').max(160),
    releaseYear: zod_1.z.coerce.number().min(1888).max(2100),
    genre: zod_1.z.string().min(1, 'Genre is required').max(160),
    durationMinutes: zod_1.z.coerce.number().min(1).max(600),
    rating: zod_1.z.coerce.number().min(0).max(10),
    languages: zod_1.z.array(zod_1.z.string()).default([]),
    certificate: zod_1.z.string().max(24).default('U/A'),
    posterUrl: zod_1.z.string().max(1200).optional().nullable(),
    art: zod_1.z.string().default('art-ember'),
    description: zod_1.z.string().max(1800).default(''),
    active: zod_1.z.boolean().default(true),
});
exports.updateMovieSchema = exports.createMovieSchema.partial();
//# sourceMappingURL=movie.schemas.js.map