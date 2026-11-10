"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingSchema = exports.snackItemSchema = exports.issueReplacementSchema = exports.recordRefundSchema = void 0;
const zod_1 = require("zod");
exports.recordRefundSchema = zod_1.z.object({
    refundReference: zod_1.z.string().min(1, 'Refund reference is required').max(120),
});
exports.issueReplacementSchema = zod_1.z.object({
    showtimeId: zod_1.z.coerce.number().int().positive('Valid showtimeId is required'),
});
exports.snackItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    qty: zod_1.z.coerce.number().int().min(1),
    price: zod_1.z.coerce.number().min(0),
});
exports.createBookingSchema = zod_1.z.object({
    showtimeId: zod_1.z.coerce.number().int().positive(),
    customerName: zod_1.z.string().min(1).max(120),
    email: zod_1.z.string().email(),
    seats: zod_1.z.array(zod_1.z.string()).min(1),
    snacks: zod_1.z.array(exports.snackItemSchema).default([]),
    total: zod_1.z.coerce.number().min(0),
    paymentMethod: zod_1.z.string().default('Simulated UPI'),
});
//# sourceMappingURL=booking.schemas.js.map