"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePromoSchema = exports.createPromoSchema = exports.validatePromoSchema = void 0;
const zod_1 = require("zod");
exports.validatePromoSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Promo code is required').max(30),
    subtotal: zod_1.z.number().min(0, 'Subtotal must be positive'),
});
exports.createPromoSchema = zod_1.z.object({
    code: zod_1.z.string().min(2, 'Code must be at least 2 characters').max(30),
    discountType: zod_1.z.enum(['percentage', 'flat']),
    discountValue: zod_1.z.number().positive('Discount value must be greater than 0'),
    maxUses: zod_1.z.number().int().positive().optional().default(100),
    active: zod_1.z.boolean().optional().default(true),
});
exports.updatePromoSchema = exports.createPromoSchema.partial();
//# sourceMappingURL=promo.schemas.js.map