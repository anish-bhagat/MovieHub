"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCinemaRouter = createCinemaRouter;
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const validate_js_1 = require("../../middleware/validate.js");
const cinema_schemas_js_1 = require("./cinema.schemas.js");
function createCinemaRouter(repo) {
    const router = (0, express_1.Router)();
    // Public endpoint: GET /api/cinemas (only active cinemas)
    router.get('/api/cinemas', (_req, res, next) => {
        try {
            const cinemas = repo.findAll(true);
            res.json(cinemas);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin endpoint: GET /api/admin/cinemas (all cinemas)
    router.get('/api/admin/cinemas', auth_js_1.requireAdminAuth, (_req, res, next) => {
        try {
            const cinemas = repo.findAll(false);
            res.json(cinemas);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin endpoint: POST /api/admin/cinemas
    router.post('/api/admin/cinemas', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(cinema_schemas_js_1.createCinemaSchema), (req, res, next) => {
        try {
            const created = repo.create(req.body);
            res.status(201).json(created);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin endpoint: PUT /api/admin/cinemas/:id
    router.put('/api/admin/cinemas/:id', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(cinema_schemas_js_1.updateCinemaSchema), (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ error: 'Invalid cinema ID' });
                return;
            }
            const updated = repo.update(id, req.body);
            if (!updated) {
                res.status(404).json({ error: 'Cinema not found' });
                return;
            }
            res.json(updated);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=cinema.router.js.map