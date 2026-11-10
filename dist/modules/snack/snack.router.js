"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSnackRouter = createSnackRouter;
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const validate_js_1 = require("../../middleware/validate.js");
const snack_schemas_js_1 = require("./snack.schemas.js");
function createSnackRouter(repo) {
    const router = (0, express_1.Router)();
    // Public: Get all in-stock snacks for booking checkout
    router.get('/api/snacks', (_req, res, next) => {
        try {
            const snacks = repo.findAll(true);
            res.json(snacks);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin: Get all snacks (including out of stock)
    router.get('/api/admin/snacks', auth_js_1.requireAdminAuth, (_req, res, next) => {
        try {
            const snacks = repo.findAll(false);
            res.json(snacks);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin: Create new snack item
    router.post('/api/admin/snacks', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(snack_schemas_js_1.createSnackSchema), (req, res, next) => {
        try {
            const created = repo.create(req.body);
            res.status(201).json(created);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin: Update snack item
    router.put('/api/admin/snacks/:id', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(snack_schemas_js_1.updateSnackSchema), (req, res, next) => {
        try {
            const updated = repo.update(req.params.id, req.body);
            if (!updated) {
                res.status(404).json({ error: 'Snack not found' });
                return;
            }
            res.json(updated);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin: Toggle in-stock status
    router.patch('/api/admin/snacks/:id/stock', auth_js_1.requireAdminAuth, (req, res, next) => {
        try {
            const updated = repo.toggleStock(req.params.id);
            if (!updated) {
                res.status(404).json({ error: 'Snack not found' });
                return;
            }
            res.json(updated);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin: Delete snack item
    router.delete('/api/admin/snacks/:id', auth_js_1.requireAdminAuth, (req, res, next) => {
        try {
            const success = repo.delete(req.params.id);
            if (!success) {
                res.status(404).json({ error: 'Snack not found' });
                return;
            }
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=snack.router.js.map