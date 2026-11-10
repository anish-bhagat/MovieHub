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
    const expectedToken = env_js_1.env.ADMIN_TOKEN;
    // Use timingSafeEqual to avoid timing attack vulnerabilities
    const expectedBuffer = Buffer.from(expectedToken);
    const providedBuffer = Buffer.from(tokenHeader);
    if (expectedBuffer.length !== providedBuffer.length ||
        !node_crypto_1.default.timingSafeEqual(expectedBuffer, providedBuffer)) {
        res.status(403).json({ error: 'Invalid admin token.' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map