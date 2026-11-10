"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRouter = createHealthRouter;
const express_1 = require("express");
function createHealthRouter() {
    const router = (0, express_1.Router)();
    router.get('/api/health', (_req, res) => {
        res.json({
            status: 'ok',
            mode: 'local SQLite',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    });
    return router;
}
//# sourceMappingURL=health.router.js.map