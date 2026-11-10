"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsRouter = createAnalyticsRouter;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_js_1 = require("../../middleware/auth.js");
const validate_js_1 = require("../../middleware/validate.js");
const blockSeatSchema = zod_1.z.object({
    seatId: zod_1.z.string().min(1, 'Seat ID is required').max(10),
});
function createAnalyticsRouter(bookingRepo, showtimeRepo) {
    const router = (0, express_1.Router)();
    // Financial & Revenue Analytics
    router.get('/api/admin/analytics', auth_js_1.requireAdminAuth, (req, res, next) => {
        try {
            const range = req.query.range || 'all';
            const stats = bookingRepo.getAnalytics(range);
            res.json(stats);
        }
        catch (err) {
            next(err);
        }
    });
    // Door Check-In Attendance Log & Audit Feed
    router.get('/api/admin/scan-logs', auth_js_1.requireAdminAuth, (req, res, next) => {
        try {
            const limit = Number(req.query.limit) || 30;
            const logs = bookingRepo.getRecentScanLogs(limit);
            res.json(logs);
        }
        catch (err) {
            next(err);
        }
    });
    // Live Hall Occupancy Inspector
    router.get('/api/admin/showtimes/:id/occupancy', auth_js_1.requireAdminAuth, (req, res, next) => {
        try {
            const showtimeId = Number(req.params.id);
            if (isNaN(showtimeId)) {
                res.status(400).json({ error: 'Invalid screening ID' });
                return;
            }
            const data = showtimeRepo.getHallOccupancy(showtimeId);
            res.json(data);
        }
        catch (err) {
            next(err);
        }
    });
    // Manual Staff Seat Blocking
    router.post('/api/admin/showtimes/:id/seats/block', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(blockSeatSchema), (req, res, next) => {
        try {
            const showtimeId = Number(req.params.id);
            if (isNaN(showtimeId)) {
                res.status(400).json({ error: 'Invalid screening ID' });
                return;
            }
            const result = showtimeRepo.toggleSeatBlock(showtimeId, req.body.seatId);
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message || 'Failed to toggle seat block' });
        }
    });
    return router;
}
//# sourceMappingURL=analytics.router.js.map