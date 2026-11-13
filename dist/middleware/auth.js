"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
const node_crypto_1 = __importDefault(require("node:crypto"));
const env_js_1 = require("../config/env.js");
function requireAdminAuth(req, res, next) {
    const tokenHeader = req.headers['x-admin-token'];
    if (!tokenHeader || typeof tokenHeader !== 'string') {
        res.status(401).json({ error: 'Admin authentication required. Please provide X-Admin-Token header.' });
        return;
    }
    // Support comma-separated list of admin tokens
    const validTokens = env_js_1.env.ADMIN_TOKEN.split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    const providedBuffer = Buffer.from(tokenHeader);
    // Check if provided token matches any valid admin token (timing-safe)
    const isMatch = validTokens.some((token) => {
        const expectedBuffer = Buffer.from(token);
        return (expectedBuffer.length === providedBuffer.length &&
            node_crypto_1.default.timingSafeEqual(expectedBuffer, providedBuffer));
    });
    if (!isMatch) {
        res.status(403).json({ error: 'Invalid admin token.' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map