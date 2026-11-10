"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSnackSchema = exports.createSnackSchema = void 0;
const zod_1 = require("zod");
exports.createSnackSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    icon: zod_1.z.string().max(10).optional().default('🍿'),
    price: zod_1.z.number().positive('Price must be greater than 0'),
    inStock: zod_1.z.boolean().optional().default(true),
    category: zod_1.z.string().max(50).optional().default('Snacks'),
    description: zod_1.z.string().max(250).optional().default(''),
});
exports.updateSnackSchema = exports.createSnackSchema.partial();
//# sourceMappingURL=snack.schemas.js.map