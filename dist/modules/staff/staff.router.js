"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaffRouter = createStaffRouter;
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const validate_js_1 = require("../../middleware/validate.js");
const staff_schemas_js_1 = require("./staff.schemas.js");
function createStaffRouter(bookingRepo) {
    const router = (0, express_1.Router)();
    // Staff endpoint: POST /api/staff/scan
    router.post('/api/staff/scan', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(staff_schemas_js_1.scanTicketSchema), (req, res, next) => {
        try {
            const result = bookingRepo.validateAndCheckIn(req.body.ticketCode);
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message || 'Validation failed' });
        }
    });
    return router;
}
//# sourceMappingURL=staff.router.js.map